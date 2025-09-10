import React from 'react';
import { ChevronRight, Home, Clock, Heart, Archive, Trash2, Folder, Users } from 'lucide-react';
import { useDocumentStore } from '../../common/store/documentStore';
import { cn } from '../../common/lib/utils';
import { useLocation } from 'react-router-dom';

export function BreadcrumbNavigation() {
  const { getBreadcrumbs, setCurrentFolder } = useDocumentStore();
  const location = useLocation();
  const breadcrumbs = getBreadcrumbs();

  // Get current page info based on route
  const getCurrentPageInfo = () => {
    const path = location.pathname;
    
    if (path === '/all-documents') {
      return { name: 'All Documents', icon: Home, isActive: true };
    } else if (path === '/recent') {
      return { name: 'Recent', icon: Clock, isActive: true };
    } else if (path === '/documents/favorites') {
      return { name: 'Favorites', icon: Heart, isActive: true };
    } else if (path === '/documents/archived') {
      return { name: 'Archived', icon: Archive, isActive: true };
    } else if (path === '/documents/trash') {
      return { name: 'Trash', icon: Trash2, isActive: true };
    } else if (path === '/documents/shared') {
      return { name: 'Shared', icon: Users, isActive: true };
    } else if (path === '/documents/folder') {
      return { name: 'Folders', icon: Folder, isActive: true };
    }
    
    return null;
  };

  const currentPage = getCurrentPageInfo();

  return (
    <nav className="flex items-center space-x-1 text-sm">
      {/* Home/All Documents - always show as root */}
      <button
        onClick={() => setCurrentFolder(null)}
        className={cn(
          "flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
         
        )}
      >
        {/* <File className="w-4 h-4 text-gray-500" /> */}
        <span>Document Management</span>
      </button>

      {/* Current Page */}
      {currentPage && (
        <>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <div className="flex items-center space-x-1 px-2 py-1 rounded-md">
            <currentPage.icon className="w-4 h-4 text-gray-500" />
            <span className="text-gray-900 font-medium">{currentPage.name}</span>
          </div>
        </>
      )}

      {/* Folder Breadcrumbs (only show for folder navigation) */}
      {location.pathname === '/documents/folder' && breadcrumbs.map((folder, index) => (
        <React.Fragment key={folder.id}>
          <ChevronRight className="w-4 h-4 text-gray-400" />
          <button
            onClick={() => setCurrentFolder(folder.id)}
            className={cn(
              "px-2 py-1 rounded-md hover:bg-gray-100 transition-colors",
              index === breadcrumbs.length - 1 
                ? "text-gray-900 font-medium" 
                : "text-gray-600"
            )}
          >
            {folder.name}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
}