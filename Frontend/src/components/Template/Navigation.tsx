import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  Layout, 
  Library, 
  FormInput, 
  Store, 
  BarChart3, 
  Code, 
  Workflow,
  Menu,
  X,
  Settings,
  User,
  Zap,
  Sparkles,
  Shield
} from 'lucide-react';

export const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Layout },
    { path: '/designer', label: 'Template Designer', icon: FileText },
    { path: '/advanced-designer', label: 'Advanced Designer', icon: Zap },
    { path: '/ai-studio', label: 'AI Studio', icon: Sparkles },
    { path: '/library', label: 'Template Library', icon: Library },
    { path: '/form-builder', label: 'Form Builder', icon: FormInput },
    { path: '/marketplace', label: 'Marketplace', icon: Store },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/api', label: 'API Management', icon: Code },
    { path: '/automation', label: 'Workflow Automation', icon: Workflow },
    { path: '/admin', label: 'Admin Dashboard', icon: Shield },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">DraftnSign</span>
                <span className="text-sm text-gray-500 hidden sm:inline">Templates</span>
              </Link>
            </div>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.path)
                        ? item.path === '/ai-studio' 
                          ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200'
                          : item.path === '/admin'
                          ? 'text-red-600 bg-red-50 border border-red-200'
                          : 'text-blue-600 bg-blue-50'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {item.path === '/ai-studio' && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
                        AI
                      </span>
                    )}
                    {item.path === '/admin' && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-600 text-white rounded-full">
                        ADMIN
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-md">
              <User className="w-5 h-5" />
            </button>
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center px-3 py-2 text-base font-medium rounded-md transition-colors ${
                    isActive(item.path)
                      ? item.path === '/ai-studio'
                        ? 'text-purple-600 bg-gradient-to-r from-purple-50 to-blue-50'
                        : item.path === '/admin'
                        ? 'text-red-600 bg-red-50'
                        : 'text-blue-600 bg-blue-50'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                  {item.path === '/ai-studio' && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full">
                      AI
                    </span>
                  )}
                  {item.path === '/admin' && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs bg-red-600 text-white rounded-full">
                      ADMIN
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};