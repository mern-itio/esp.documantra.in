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
  Trash2,
  Move,
  Folder,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BreadcrumbNavigation } from '../common/BreadcrumbNavigation';
import { UploadModal } from '../modals/UploadModal';
import { SearchModal } from '../modals/SearchModal';
import { CreateFolderModal } from '../modals/CreateFolderModal';
import { ShareModal } from '../modals/ShareModal';
import { MoveDocumentsModal, type FolderData } from '../modals/MoveDocumentsModal';
import PDFShareButton from '../sharing/PDFShareButton';
import { useDocumentStore } from '../../common/store/documentStore';
import { folderAPI, documentAPI } from '../../../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
export function DocumentHeader() {
  const {
    searchQuery,
    setSearchQuery,
    searchFilters,
    setSearchFilters,
    viewMode,
    setViewMode,
    sortBy,
    sortOrder,
    setSorting,
    selectedDocuments,
    userPermissions,
    isLoading
  } = useDocumentStore();

  const [showUpload, setShowUpload] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [folders, setFolders] = useState<FolderData[]>([]);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const hasSelection = selectedDocuments.length > 0;


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

  const handleCreateFolderSubmit = async (folderData: { name: string; description: string; color: string; icon: string }) => {
    try {
      const response = await folderAPI.createFolder(folderData);

      if (response.success) {
        setShowCreateFolder(false);

        const store = useDocumentStore.getState();
        await store.fetchFolders(); // Refresh folders in the store
        await store.refreshData(); // Refresh all data

        await loadFolders();
        // navigate(`/folders/${response.data.id}`);
        navigate(`/documents/folder`);
        // Dispatch custom event to notify other components
        window.dispatchEvent(new CustomEvent('folderCreated', {
          detail: { folder: response.data }
        }));

      } else {
        console.error('❌ DocumentHeader: Folder creation failed:', response.message);
        // Throw error to be caught by the modal
        throw new Error(response.message || 'Failed to create folder');
      }
    } catch (error) {
      console.error('❌ DocumentHeader: Failed to create folder:', error);
      // Re-throw the error so the modal can display it
      throw error;
    }
  };

  const handleMoveDocuments = async (targetFolderId: string | null) => {
    try {
      if (selectedDocuments.length === 0) return;

      const response = await documentAPI.moveMultipleDocuments(selectedDocuments, targetFolderId);
      if (response.success) {
        setShowMoveModal(false);
        // Clear selection after successful move
        useDocumentStore.getState().setSelectedDocuments([]);
        // You might want to refresh the document list here
      }
    } catch (error) {
      console.error('Failed to move documents:', error);
    }
  };

  const loadFolders = async () => {
    try {
      const response = await folderAPI.getUserFolders();

      if (response.success) {
        setFolders(response.data);
      } else {
        console.error('❌ DocumentHeader: Failed to load folders:', response.message);
      }
    } catch (error) {
      console.error('❌ DocumentHeader: Failed to load folders:', error);
    }
  };

  // Load folders on component mount
  useEffect(() => {
    loadFolders();
  }, []);

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
  const clearFilters = () => {
    setSearchQuery('');
    setSearchFilters({});
  };

  // Check if any filters are applied
  const hasActiveFilters = searchQuery || Object.keys(searchFilters).length > 0;
  return (
    <div className="border-b border-border bg-card px-6 py-4 text-card-foreground">
      {/* Breadcrumb */}
      <BreadcrumbNavigation />

      {/* Main Header */}
      <div className="flex items-center justify-between mt-4">
        {/* Left side - Search */}
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
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
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">


          {/* Bulk Actions (when documents are selected) */}
          {hasSelection && (
            <div className="mr-4 flex items-center space-x-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 dark:bg-primary/15">
              <span className="text-sm font-medium text-primary">
                {selectedDocuments.length} selected
              </span>
              <div className="flex items-center space-x-1">
                {/* Share */}
                <div className="relative group">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 hover:bg-accent hover:text-accent-foreground"
                    onClick={() => setShowShareModal(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <Share2 className="w-3 h-3" />
                  </Button>
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block"
                  >
                    Share
                  </span>
                </div>

                {/* Move */}
                <div className="relative group">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => setShowMoveModal(true)}
                    style={{ cursor: "pointer" }}
                  >
                    <Move className="w-3 h-3" />
                  </Button>
                  <span
                    className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block"
                  >
                    Move
                  </span>
                </div>

                {/* Delete */}
                {userPermissions.delete_any && (
                  <div className="relative group">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <span
                      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 hidden -translate-x-1/2 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md group-hover:block"
                    >
                      Delete
                    </span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Sort */}
          <Button
            variant="outline" size="sm"
            onClick={handleSortToggle}
            className="hidden sm:flex "
          >
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {sortOrder === "asc" ? (
                <SortAsc className="w-4 h-4 mr-2" />
              ) : (
                <SortDesc className="w-4 h-4 mr-2" />
              )}

              {/* Tooltip */}
              {showTooltip && (
                <span className="absolute left-0 top-6 z-50 whitespace-nowrap rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md">
                  {sortOrder === "asc" ? "Sorted Ascending" : "Sorted Descending"}
                </span>
              )}
            </div>
            Sort
          </Button>

          { location.pathname !== "/documents/shared-pdf" && (
          <div className="flex overflow-hidden rounded-lg border border-border">
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
       )}
          {/* Upload */}
          {userPermissions.upload && location.pathname !== "/documents/shared-pdf" && (
            <Button
              onClick={() => setShowUpload(true)}
              disabled={isLoading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
          )}


          {/* PDF Share - Only show on /documents/shared-pdf route */}
          {location.pathname === '/documents/shared-pdf' && <PDFShareButton />}

          {/* More Actions */}
          <div className="relative" ref={moreMenuRef}>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMoreMenuToggle}
              style={{ cursor: 'pointer' }}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>

            {/* Dropdown Menu */}
            {showMoreMenu && (
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
                <div className="py-1">
                  <button
                    onClick={handleCreateFolder}
                    className="flex w-full items-center space-x-2 px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
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
        onSubmit={handleCreateFolderSubmit}
        parentFolderName={undefined}
      />

      <MoveDocumentsModal
        isOpen={showMoveModal}
        onClose={() => setShowMoveModal(false)}
        onSubmit={handleMoveDocuments}
        selectedCount={selectedDocuments.length}
        availableFolders={folders}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        selectedDocuments={selectedDocuments}

      />
    </div>
  );
}