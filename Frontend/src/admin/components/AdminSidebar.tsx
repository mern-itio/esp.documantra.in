import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, 
  ChevronLeft, 
  ChevronDown, 
  ChevronRight, 
  FileSignature, 
  Settings, 
  Users, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  Key,
  CreditCard,
  FileText,
} from 'lucide-react';

interface AdminSidebarProps {
  activeView?: string;
  setActiveView?: (view: any) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  path?: string;
  icon?: React.ComponentType<any>;
  children?: SubMenuItem[];
}

interface SubMenuItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ComponentType<any>;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeView = 'dashboard',
  setActiveView = () => { },
  isOpen = true,
  setIsOpen = () => { }
}) => {
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to determine active view based on current route
  const getActiveViewFromRoute = (pathname: string): string => {
    // Check for exact matches first
    if (pathname === '/admin/dashboard') return 'dashboard';
    if (pathname === '/admin/users') return 'users';
    if (pathname === '/admin/pdf-tools') return 'pdf-tools-management';
    if (pathname === '/admin/subscription') return 'subscription-management';
    if (pathname === '/admin/analytics') return 'analytics';
    if (pathname === '/admin/settings') return 'settings';
    if (pathname === '/admin/monitoring') return 'monitoring';
    
    // Check for PDF tools/document management routes
    if (pathname.startsWith('/admin/pdf-tools') || pathname.startsWith('/admin/documents')) {
      const urlParams = new URLSearchParams(location.search);
      const category = urlParams.get('category');
      
      if (category === 'all') return 'all-documents';
      if (category === 'pending') return 'pending-documents';
      if (category === 'approved') return 'approved-documents';
      if (category === 'rejected') return 'rejected-documents';
      
      return 'all-documents';
    }
    
    // Check for e-sign management routes
    if (pathname.startsWith('/admin/e-sign')) {
      const urlParams = new URLSearchParams(location.search);
      const category = urlParams.get('category');
      
      if (category === 'all') return 'all-esign';
      if (category === 'pending') return 'pending-esign';
      if (category === 'completed') return 'completed-esign';
      if (category === 'expired') return 'expired-esign';
      
      return 'all-esign';
    }
   
    
    return 'dashboard'; // Default fallback
  };

  // Update active view when route changes
  useEffect(() => {
    const newActiveView = getActiveViewFromRoute(location.pathname);
    setActiveView(newActiveView);
    
    // Also expand the appropriate parent menu
    const pathname = location.pathname;
    if (pathname.startsWith('/admin/pdf-tools') || pathname.startsWith('/admin/documents')) {
      setExpandedMenu('pdf-tools-management');
    } else if (pathname.startsWith('/admin/e-sign')) {
      setExpandedMenu('e-sign-management');
    } else if (pathname.startsWith('/admin/users')) {
    } else if (pathname.startsWith('/admin/subscription')) {
      setExpandedMenu('subscription-management');
    } else if (pathname.startsWith('/admin/users')) {
      setExpandedMenu('user-management');
    } else if (pathname.startsWith('/admin/system')) {
      setExpandedMenu('system-management');
    }
  }, [location.pathname, setActiveView]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    {
      id: 'user-management',
      label: 'User Management',
      icon: Users,
      children: [
        { id: 'users', label: 'All Users', path: '/admin/users', icon: Users },
        { id: 'user-roles', label: 'User Roles', path: '/admin/users/roles', icon: Shield },
        { id: 'user-permissions', label: 'Permissions', path: '/admin/users/permissions', icon: Key },
      ]
    },
    { id: 'pdf-tools-management', label: 'PDF Tools Management', icon: FileText, path: '/admin/pdf-tools' },
    
    {
      id: 'e-sign-management',
      label: 'E-Sign Management',
      icon: FileSignature,
      children: [
        { id: 'all-esign', label: 'All E-Signs', path: '/admin/e-sign?category=all', icon: FileSignature },
        { id: 'pending-esign', label: 'Pending', path: '/admin/e-sign?category=pending', icon: AlertTriangle },
        { id: 'completed-esign', label: 'Completed', path: '/admin/e-sign?category=completed', icon: FileSignature },
        { id: 'expired-esign', label: 'Expired', path: '/admin/e-sign?category=expired', icon: FileSignature },
      ]
    },
    {
      id: 'subscription-management',
      label: 'Subscription Management',
      icon: CreditCard,
     path: '/admin/subscription',
    },
   
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const toggleSubmenu = (id: string) => {
    setExpandedMenu(prev => (prev === id ? null : id));
  };

  const handleNavigation = (path: string, id: string) => {
    setActiveView(id);
    navigate(path);
  };

  const handleMainMenuClick = (item: MenuItem) => {
    if (item.children) {
      toggleSubmenu(item.id);
    } else if (item.path) {
      handleNavigation(item.path, item.id);
    }
  };

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ${isOpen ? 'w-70' : 'w-16'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          {isOpen && (
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            <ChevronLeft
              className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''
                }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const currentUrl = `${location.pathname}${location.search}`;
            const isChildActive = item.children?.some(sub => currentUrl.startsWith(sub.path) || activeView === sub.id);
            const isItemActive = activeView === item.id || !!isChildActive;
            return (
            <div key={item.id}>
              <button
                onClick={() => handleMainMenuClick(item)}
                className={`w-full text-sm flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${isItemActive
                  ? 'bg-red-50 text-red-700 border-r-2 border-red-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                style={{cursor: 'pointer'}}
              >
                <div className="flex items-center space-x-3">
                  {item.icon && (
                    <item.icon
                      className={`h-5 w-5 ${isItemActive ? 'text-red-600' : 'text-gray-400'
                        }`}
                    />
                  )}
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
                      className={`w-full flex items-center px-3 py-2 rounded-md text-sm transition-all duration-200 ${(activeView === sub.id) || currentUrl.startsWith(sub.path)
                        ? 'bg-red-50 text-red-700'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        style={{cursor: 'pointer'}}
                    >
                      <div className="flex items-center space-x-2">
                        {sub.icon && (
                          <sub.icon
                            className={`h-4 w-4 ${(activeView === sub.id) || currentUrl.startsWith(sub.path) ? 'text-red-600' : 'text-gray-400'
                              }`}
                          />
                        )}
                        <span>{sub.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );})}
        </nav>
      </div>
    </div>
  );
};

export default AdminSidebar;
