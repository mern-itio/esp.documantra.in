import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Building2
} from 'lucide-react';

interface SidebarProps {
  activeView?: string;
  setActiveView?: (view: any) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeView = 'dashboard',
  setActiveView = () => {},
  isOpen = true,
  setIsOpen = () => {}
}) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    {
      id: 'document-management',
      label: 'Documents',
      icon: FileText,
      children: [
        { id: 'all-documents', label: 'All Documents', path: '/all-documents' },
        { id: 'recent', label: 'Recent', path: '/recent' },
        { id: 'Favorites', label: 'Favorites', path: '/documents/favorites' },
        { id: 'shared', label: 'Shared with me', path: '/documents/shared' },
        { id: 'archived', label: 'Archived', path: '/documents/archived' },
        { id: 'folders', label: 'Folders', path: '/documents/folder' },
        { id: 'trash', label: 'Trash', path: '/documents/trash' }
      ]
    }
  ];

  const toggleSubmenu = (id: string) => {
    setExpandedMenu(prev => (prev === id ? null : id));
  };

  const handleNavigation = (path: string, id: string) => {
    setActiveView(id);
    navigate(path);
  };

  const handleMainMenuClick = (item: any) => {
    if (item.children) {
      toggleSubmenu(item.id);
    } else if (item.path) {
      handleNavigation(item.path, item.id);
    }
  };

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">DraftnSign</h1>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            <ChevronLeft
              className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${
                !isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => handleMainMenuClick(item)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                  activeView === item.id
                    ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <item.icon
                    className={`h-5 w-5 ${
                      activeView === item.id ? 'text-primary-600' : 'text-gray-400'
                    }`}
                  />
                  {isOpen && <span className="font-medium">{item.label}</span>}
                </div>
                {item.children && isOpen && (
                  expandedMenu === item.id ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )
                )}
              </button>

              {/* Submenu */}
              {item.children && expandedMenu === item.id && isOpen && (
                <div className="ml-10 mt-1 space-y-1">
                  {item.children.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => handleNavigation(sub.path, sub.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                        activeView === sub.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
