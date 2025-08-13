import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Grid3X3,
  List,
  Upload,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Share2,
  Download,
  Trash2,
  Move,
  Star,
  Folder
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BreadcrumbNavigation } from '../common/BreadcrumbNavigation';
import { UploadModal } from '../modals/UploadModal';
import { SearchModal } from '../modals/SearchModal';
import { CreateFolderModal } from '../modals/CreateFolderModal';
import { ShareModal } from '../modals/ShareModal';
import { useDocumentStore } from '../../common/store/documentStore';

export function DocumentHeader() {
  const {
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortBy,
    sortOrder,
    setSorting,
    selectedDocuments,
    userPermissions,
    isLoading
  } = useDocumentStore();

  // Debug logging for selection
  // console.log('🔍 DocumentHeader - selectedDocuments:', selectedDocuments);
  // console.log('🔍 DocumentHeader - hasSelection:', selectedDocuments.length > 0);
  // console.log('🔍 DocumentHeader - store state:', useDocumentStore.getState());

  const [showUpload, setShowUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const hasSelection = selectedDocuments.length > 0;
  
  // Debug logging for hasSelection
  console.log('🔍 DocumentHeader - hasSelection calculated:', hasSelection);

  const handleSortToggle = () => {
    setSorting(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleMoreMenuToggle = () => {
    setShowMoreMenu(!showMoreMenu);
  };

  const handleCreateFolder = () => {
    setShowCreateFolder(true);
    setShowMoreMenu(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setShowMoreMenu(false);
      }
    };

    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMoreMenu]);

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Breadcrumb */}
      <BreadcrumbNavigation />

      {/* Main Header */}
      <div className="flex items-center justify-between mt-4">
        {/* Left side - Search */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
              onFocus={() => setShowSearch(true)}
            />
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearch(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
              
          
          {/* Bulk Actions (when documents are selected) */}
          {hasSelection && (
            <div className="flex items-center space-x-2 mr-4 px-3 py-1 bg-blue-50 rounded-lg">
              <span className="text-sm text-blue-700 font-medium">
                {selectedDocuments.length} selected
              </span>
              <div className="flex items-center space-x-1">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-7 px-2 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => setShowShareModal(true)}
                >
                  <Share2 className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Download className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Move className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <Star className="w-3 h-3" />
                </Button>
                {userPermissions.delete_any && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Sort */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSortToggle}
            className="hidden sm:flex"
          >
            {sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4 mr-2" />
            ) : (
              <SortDesc className="w-4 h-4 mr-2" />
            )}
            Sort
          </Button>

          {/* View Toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none border-0"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          {/* Upload */}
          {userPermissions.upload && (
            <Button
              onClick={() => setShowUpload(true)}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          )}

          {/* More Actions */}
          <div className="relative" ref={moreMenuRef}>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleMoreMenuToggle}
              style={{cursor: 'pointer'}}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            
            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={handleCreateFolder}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                  >
                    <Folder className="w-4 h-4" />
                    <span>Create Folder</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <UploadModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
      />

      <SearchModal
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />

      <CreateFolderModal
        isOpen={showCreateFolder}
        onClose={() => setShowCreateFolder(false)}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        selectedDocuments={selectedDocuments}
      />
    </div>
  );
}