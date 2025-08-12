import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useDocumentStore } from '../../common/store/documentStore';
import { cn } from '../../common/lib/utils';

export function BreadcrumbNavigation() {
  const { getBreadcrumbs, setCurrentFolder } = useDocumentStore();
  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center space-x-1 text-sm">
      <button
        onClick={() => setCurrentFolder(null)}
        className="flex items-center space-x-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
      >
        <Home className="w-4 h-4 text-gray-500" />
        <span className="text-gray-600 font-medium">All Documents</span>
      </button>

      {breadcrumbs.map((folder, index) => (
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