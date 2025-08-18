import { useState, useEffect } from 'react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useAuthInitialization } from '../../hooks/useAuthInitialization';
import { DocumentCard } from '../../components/DocumentService/documents/DocumentCard';
import { EmptyState } from '../../components/DocumentService/common/EmptyState';
import { CollaborationHub } from '../../components/DocumentService/collaboration/CollaborationHub';
import { Users, Eye, Edit, MessageSquare } from 'lucide-react';
import { documentAPI } from '../../services/api';
import type { Document } from '../../components/common/types';

export function SharedDocumentsPage() {
  const [sharedDocuments, setSharedDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Use AuthContext for user data instead of document store
  const { user: currentUser } = useAuth();
  
  // Initialize document store with user data
  useAuthInitialization();

  // Debug section - remove this after fixing the issue
  useEffect(() => {
    console.log('🔍 SharedDocumentsPage Debug Info:');
    console.log('Current User from AuthContext:', currentUser);
    console.log('localStorage accessToken:', localStorage.getItem('accessToken'));
    console.log('localStorage userData:', localStorage.getItem('userData'));
    
    if (currentUser) {
      console.log('✅ User is authenticated');
    } else {
      console.log('❌ User is NOT authenticated');
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadSharedDocuments();
    }
  }, [currentUser]);

  const loadSharedDocuments = async () => {
    if (!currentUser) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get all documents and filter for shared ones
      const response = await documentAPI.getUserDocuments();
      console.log("Current User:", currentUser);
      console.log("API Response:", response);
      
      if (response.success && response.data.documents) {
        console.log("All Documents:", response.data.documents);
        console.log("First Document SharedWith:", response.data.documents[0]?.sharedWith);
        
        const filtered = response.data.documents.filter((doc: any) => {
          if (!doc.sharedWith || !Array.isArray(doc.sharedWith)) {
            console.log(`Document ${doc.name} has no sharedWith or it's not an array:`, doc.sharedWith);
            return false;
          }
          
          const isShared = doc.sharedWith.some((share: any) => {
            const emailMatch = share.email === currentUser.email;
            const userIdMatch = share.userId === currentUser.email || share.userId === currentUser.id;
            console.log(`Checking share:`, { share, emailMatch, userIdMatch, currentUserEmail: currentUser.email, currentUserId: currentUser.id });
            return emailMatch || userIdMatch;
          });
          
          console.log(`Document ${doc.name} is shared:`, isShared);
          return isShared;
        });

        console.log("Filtered Shared Documents:", filtered);

        // Transform to match Document interface
        const transformed = filtered.map((doc: any) => ({
          id: doc._id,
          name: doc.name,
          type: doc.type,
          size: doc.size,
          createdAt: doc.createdAt,
          modifiedAt: doc.modifiedAt,
          uploadedBy: doc.uploadedBy,
          ownerId: doc.ownerId,
          folderId: doc.folderId?._id || doc.folderId,
          tags: doc.tags || [],
          shared: true,
          views: doc.views || 0,
          downloads: doc.downloads || 0,
          sharedWith: doc.sharedWith || [],
          isArchived: doc.isArchived || false,
          isFavorite: doc.isFavorite || false,
          description: doc.description || '',
          thumbnail: doc.thumbnail,
          content: doc.content
        }));

        setSharedDocuments(transformed);
      } else {
        setError(response.message || 'Failed to load shared documents');
      }
    } catch (error: any) {
      console.error('Error loading shared documents:', error);
      setError(error.message || 'Failed to load shared documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentSelect = (documentId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedDocuments([...selectedDocuments, documentId]);
    } else {
      setSelectedDocuments(selectedDocuments.filter(id => id !== documentId));
    }
  };

  const handleDocumentClick = (document: Document) => {
    console.log('Document clicked, opening in CollaborationHub:', document.id);
    setSelectedDocument(document);
  };

  const getPermissionForUser = (document: Document) => {
    if (!currentUser) return 'view';
    
    const share = document.sharedWith?.find((s: any) => 
      s.userId === currentUser.email || s.userId === currentUser.id || s.email === currentUser.email
    );
    return share?.permission || 'view';
  };

  const getPermissionIcon = (permission: string) => {
    switch (permission) {
      case 'view':
        return <Eye className="w-4 h-4" />;
      case 'edit':
        return <Edit className="w-4 h-4" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Eye className="w-4 h-4" />;
    }
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'view':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'edit':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'comment':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium mb-2">Error Loading Documents</div>
          <div className="text-gray-500 mb-4">{error}</div>
          <button
            onClick={loadSharedDocuments}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (sharedDocuments.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Shared Documents"
        description="Documents shared with you will appear here. Ask your team members to share documents with you."
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">      
      <div className="p-6">
        {/* Page Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shared with Me</h1>
              <p className="text-gray-500">
                {sharedDocuments.length} document{sharedDocuments.length !== 1 ? 's' : ''} shared with you
              </p>
            </div>
          </div>
        </div>

        {/* Selection Header */}
        {selectedDocuments.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700 font-medium">
              {selectedDocuments.length} document{selectedDocuments.length !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSelectedDocuments([])}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Clear Selection
            </button>
          </div>
        )}

        {/* Documents Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {sharedDocuments.map((document) => {
            const permission = getPermissionForUser(document);
            
            return (
              <div key={document.id} className="relative">
                <DocumentCard
                  document={document}
                  isSelected={selectedDocuments.includes(document.id)}
                  onSelect={(isSelected) => handleDocumentSelect(document.id, isSelected)}
                  onClick={handleDocumentClick}
                />
                
                {/* Permission Badge */}
                <div className="absolute top-2 right-2 z-20">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(permission)}`}>
                    <div className="flex items-center space-x-1">
                      {getPermissionIcon(permission)}
                      <span className="capitalize">{permission}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
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
}
