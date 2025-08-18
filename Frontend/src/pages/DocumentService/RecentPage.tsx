import React, { useState, useEffect } from 'react';
import { Folder } from 'lucide-react';
import { Button } from '../../components/DocumentService/ui/button';
// import { Input } from '../../components/DocumentService/ui/input';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { useDocumentStore } from '../../components/common/store/documentStore';
import { documentAPI } from '../../services/api';
import type { Document } from '../../components/common/types';

// interface DocumentData {
//   _id: string;
//   name: string;
//   type: string;
//   size: number;
//   mimeType: string;
//   createdAt: string;
//   modifiedAt: string;
//   ownerId: string;
//   uploadedBy: string;
//   folderId?: string;
//   isFavorite: boolean;
//   isArchived: boolean;
// }

const RecentPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm] = useState('');
  const [viewMode] = useState<'grid' | 'list'>('grid');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  
  // Get documents from store to listen for changes
  const storeDocuments = useDocumentStore((state: any) => state.documents);

  // Load recent documents
  useEffect(() => {
    loadRecentDocuments();
  }, []);

  // Filter documents based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredDocuments(documents);
    } else {
      const filtered = documents.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredDocuments(filtered);
    }
  }, [searchTerm, documents]);

  // Listen to changes in store documents and refresh recent documents
  useEffect(() => {
    if (storeDocuments.length > 0) {
      // Get recent documents from store (sorted by createdAt desc)
      const recentFromStore = storeDocuments
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100);
      
      if (recentFromStore.length !== documents.length) {
        setDocuments(recentFromStore);
        setFilteredDocuments(recentFromStore);
      }
    }
  }, [storeDocuments, documents.length]);

  const loadRecentDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await documentAPI.getUserDocuments({
        sortBy: 'createdAt',
        sortOrder: 'desc',
        limit: 100 // Get last 100 documents
      });
      
      console.log('API Response:', response); // Debug log
      
             if (response && response.success && response.data && response.data.documents && Array.isArray(response.data.documents)) {
         setDocuments(response.data.documents);
         setFilteredDocuments(response.data.documents);
       } else if (response && response.success && Array.isArray(response.data)) {
         // Handle case where response.data is directly an array
         setDocuments(response.data);
         setFilteredDocuments(response.data);
       } else if (response && Array.isArray(response)) {
         // Handle case where response is directly an array
         setDocuments(response);
         setFilteredDocuments(response);
       } else {
         console.warn('Unexpected API response structure:', response);
         setDocuments([]);
         setFilteredDocuments([]);
       }
    } catch (error) {
      console.error('Failed to load recent documents:', error);
      setDocuments([]);
      setFilteredDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
  };

  // const transformDocumentData = (doc: DocumentData): Document => ({
  //   id: doc._id,
  //   name: doc.name,
  //   type: doc.type,
  //   size: doc.size,
  //   createdAt: doc.createdAt,
  //   modifiedAt: doc.modifiedAt,
  //   uploadedBy: doc.uploadedBy,
  //   ownerId: doc.ownerId,
  //   folderId: doc.folderId || null,
  //   tags: [],
  //   shared: false,
  //   views: 0,
  //   downloads: 0,
  //   thumbnail: undefined,
  //   content: '',
  //   sharedWith: [],
  //   isArchived: doc.isArchived,
  //   isFavorite: doc.isFavorite
  // });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
    
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
     
         <div className="mb-4">
           <p className="text-sm text-gray-600">
             Showing {Array.isArray(filteredDocuments) ? filteredDocuments.length : 0} of {Array.isArray(documents) ? documents.length : 0} recent documents
           </p>
         </div>

        {/* Documents Grid/List */}
        {!Array.isArray(filteredDocuments) || filteredDocuments.length === 0 ? (
          <div className="text-center py-12">
            <Folder className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {searchTerm ? 'No documents found' : 'No recent documents'}
            </h3>
                         <p className="mt-1 text-sm text-gray-500">
               {searchTerm 
                 ? 'Try adjusting your search terms'
                 : 'No recent documents found. Documents will appear here after you upload them from other pages.'
               }
             </p>
            
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                 {filteredDocuments.map((document) => (
                  <div key={document.id} className="relative">
                    <DocumentCard
                      document={document}
                      isSelected={false}
                      onSelect={() => {}} // No selection needed for recent page
                      onClick={() => handleDocumentClick(document)}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uploaded
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDocuments.map((document) => (
                      <tr key={document.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-5 h-5 bg-gray-100 rounded mr-3 flex items-center justify-center">
                              <span className="text-xs text-gray-600">{document.type.toUpperCase()}</span>
                            </div>
                                                         <button
                               onClick={() => handleDocumentClick(document)}
                               className="text-sm font-medium text-gray-900 hover:text-primary-600 hover:underline cursor-pointer"
                             >
                               {document.name}
                             </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {document.type.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatFileSize(document.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(document.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                     <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => handleDocumentClick(document)}
                           >
                             Open
                           </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      

      {/* Collaboration Hub - Document Detail View */}
      {selectedDocument && (
        <CollaborationHub
          document={selectedDocument}
          onClose={() => setSelectedDocument(null)}
        />
      )}
    </div>
  );
};

export default RecentPage;
