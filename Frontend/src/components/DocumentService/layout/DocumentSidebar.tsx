import { useEffect, useState } from 'react';
import { Folder, Plus, Search, Star, Archive, Trash2, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { useDocumentStore } from '../../common/store/documentStore';
// import { CreateFolderModal } from '../modals/CreateFolderModal';
import Loader from '../../common/loader';

interface DocumentSidebarProps {
  onFolderSelect: (folderId: string | null) => void;
  currentFolderId: string | null;
}

export function DocumentSidebar({ onFolderSelect, currentFolderId }: DocumentSidebarProps) {
  const { 
    folders, 
    fetchFolders, 
    isLoading,
    currentUser 
  } = useDocumentStore();
  
  // const [, setIsCreateFolderOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch folders when component mounts
  useEffect(() => {
    const initializeFolders = async () => {
      try {
        await fetchFolders();
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to fetch folders:', error);
      }
    };

    initializeFolders();
  }, [fetchFolders]);

  // Filter folders based on search query
  const filteredFolders = folders.filter(folder =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  );



  const handleFolderClick = (folderId: string | null) => {
    onFolderSelect(folderId);
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader />
      </div>
    );
  }

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            // onClick={() => setIsCreateFolderOpen(true)}
            title="Create new folder"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2">
          {/* Quick Actions */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              Quick Access
            </h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleFolderClick(null)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    currentFolderId === null
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Folder className="w-4 h-4 mr-2" />
                  All Documents
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFolderClick('favorites')}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    currentFolderId === 'favorites'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Star className="w-4 h-4 mr-2" />
                  Favorites
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFolderClick('archived')}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    currentFolderId === 'archived'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archived
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleFolderClick('trash')}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    currentFolderId === 'trash'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Trash
                </button>
              </li>
            </ul>
          </div>

          {/* Folders */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-3">
              Folders
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader />
              </div>
            ) : filteredFolders.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchQuery ? 'No folders found' : 'No folders yet'}
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredFolders.map((folder) => (
                  <li key={folder.id}>
                    <button
                      onClick={() => handleFolderClick(folder.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                        currentFolderId === folder.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div 
                        className="w-3 h-3 rounded mr-2 flex-shrink-0"
                        style={{ backgroundColor: folder.color }}
                      />
                      <span className="truncate">{folder.name}</span>
                      {folder.documentCount > 0 && (
                        <span className="ml-auto text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {folder.documentCount}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>{currentUser?.name || 'User'}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Create Folder Modal */}
              {/* <CreateFolderModal
          isOpen={isCreateFolderOpen}
          onClose={() => setIsCreateFolderOpen(false)}
        /> */}
    </div>
  );
}