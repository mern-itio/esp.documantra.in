import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {LayoutDashboard, FileText, ChevronLeft, ChevronDown, ChevronRight, Building2, FileSignature, Scissors, Repeat, Edit3, Copy, Settings, Search, FileSpreadsheet, Wrench, Lock, Clock, Star, Share2, Archive, Folder, Trash2, LayoutDashboardIcon, Key,  BarChart3, FolderOpen, Play, Book, Webhook, Package, TestTube, Store, Users, HelpCircle, Layers, Layout, Cpu, ClipboardList, ShoppingCart, Code, Zap, File, Mail, FileEdit, Pencil, CheckCircle, Trash2Icon, FormInput, Send} from 'lucide-react';

interface SidebarProps {
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

const Sidebar: React.FC<SidebarProps> = ({
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
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/all-documents') return 'all-documents';
    if (pathname === '/recent') return 'recent';
    if (pathname === '/documents/favorites') return 'favorites';
    if (pathname === '/documents/shared') return 'shared';
    if (pathname === '/documents/shared-pdf') return 'shared-pdf';
    if (pathname === '/documents/archived') return 'archived';
    if (pathname === '/documents/folder') return 'folders';
    if (pathname === '/documents/trash') return 'trash';

    if (pathname.startsWith('/e-sign/')) {
      if (pathname === '/e-sign/aggrement' || pathname === '/e-sign/aggrement/all') return 'esignDashboard';
      if (pathname.startsWith('/e-sign/aggrement/draft')) return 'esignDraft';
      if (pathname.startsWith('/e-sign/aggrement/in-progress')) return 'esignInProgress';
      if (pathname.startsWith('/e-sign/aggrement/completed')) return 'esignCompleted';
      if (pathname.startsWith('/e-sign/aggrement/deleted')) return 'esignDeleted';
      if (pathname.startsWith('/e-sign/create')) return 'create';
      // Any other e-sign route - keep e-sign expanded but don't force dashboard
      return 'e-sign';
    }
    // Check for PDF Tools routes
    if (pathname.startsWith('/pdf-tools')) {
      const urlParams = new URLSearchParams(location.search);
      const category = urlParams.get('category');
      
      // If we have a category in the URL, use it
      if (category === 'conversion') return 'conversion';
      if (category === 'editing') return 'editing';
      if (category === 'pages') return 'pages';
      if (category === 'security') return 'security';
      if (category === 'optimization') return 'optimization';
      if (category === 'ocr') return 'ocr';
      if (category === 'forms') return 'forms';
      if (category === 'utilities') return 'utilities';
      
      return 'all'; // Default to all tools
    }   
    
    return 'dashboard'; // Default fallback
  };

  // Update active view when route changes
  useEffect(() => {
    const newActiveView = getActiveViewFromRoute(location.pathname);
    setActiveView(newActiveView);
    
    // Also expand the appropriate parent menu
    const pathname = location.pathname;
    if (pathname.startsWith('/documents/') || pathname === '/all-documents' || pathname === '/recent') {
      setExpandedMenu('document-management');
    } else if (pathname.startsWith('/e-sign/')) {
      setExpandedMenu('e-sign');
    } else if (pathname.startsWith('/template/')) {
      setExpandedMenu('template');
    } else if (pathname.startsWith('/pdf-tools')) {
      setExpandedMenu('pdf-tools');
    } else if (pathname.startsWith('/api-service/')) {
      setExpandedMenu('API-Keys');
    }
  }, [location.pathname, setActiveView]);

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    {
      id: 'document-management',
      label: 'Documents',
      icon: FileText,
      children: [
        { id: 'all-documents', label: 'All Documents', path: '/all-documents', icon: FileText },
        { id: 'recent', label: 'Recent', path: '/recent', icon: Clock },
        { id: 'favorites', label: 'Favorites', path: '/documents/favorites', icon: Star },
        { id: 'shared', label: 'Shared with me', path: '/documents/shared', icon: Share2 },
        { id: 'shared-pdf', label: 'Document Share', path: '/documents/shared-pdf', icon: File },
        { id: 'archived', label: 'Archived', path: '/documents/archived', icon: Archive },
        { id: 'folders', label: 'Folders', path: '/documents/folder', icon: Folder },
        { id: 'trash', label: 'Trash', path: '/documents/trash', icon: Trash2 }
      ]
    },
   {
      id: 'e-sign',
      label: 'E-Sign',
      icon: FileSignature,
      children: [
        { id: 'create', label: 'Send an Envelope', path: '/e-sign/create' },
        { id: 'esignDashboard', label: 'All Agreement', path: '/e-sign/aggrement', icon: Mail },
        { id: 'esignDraft', label: 'Drafts', path: '/e-sign/aggrement/draft', icon: FileEdit },
        { id: 'esignInProgress', label: 'In Progress', path: '/e-sign/aggrement/in-progress', icon: Pencil },
        { id: 'esignCompleted', label: 'Completed', path: '/e-sign/aggrement/completed', icon: CheckCircle },
        { id: 'esignDeleted', label: 'Deleted', path: '/e-sign/aggrement/deleted', icon: Trash2Icon },
        // { id: 'sent', label: 'Add Envelope', path: '/e-sign/sent', icon: MailPlus },
        { id: 'powerforms', label: 'PowerForms', path: '/e-sign/powerforms', icon: FormInput },
        { id: 'bulk-send', label: 'Bulk Send', path: '/e-sign/bulk-send', icon: Send },
        // { id: 'aggrement', label: 'Aggrement', path: '/e-sign/aggrement', icon: FileSignature },
        // { id: 'manage_receipients', label: 'Manage Receipients', path: '/e-sign/manage_receipients', icon: MailIcon },
        // { id: 'envelope_types', label: 'Envelope Types', path: '/e-sign/envelope_types', icon: MailIcon },
        // { id: 'analytics', label: 'Analytics', path: '/e-sign/analytics', icon: BarChart3Icon },
        // { id: 'settings', label: 'Settings', path: '/e-sign/settings', icon: Settings },
        // { id: 'enterprise', label: 'Enterprise', path: '/e-sign/enterprise', icon: Building2 },
        // { id: 'admin', label: 'Admin', path: '/e-sign/admin', icon: UserCog }
      ]
    },
    {
      id: 'template',
      label: 'Template',
      icon: Layers,
      children: [
        { id: 'templateDashboard', label: 'Dashboard', path: '/template/dashboard', icon: LayoutDashboardIcon },
        { id: 'templateDesign', label: 'Design', path: '/template/designer', icon: Edit3 },
        { id: 'advanceTemplateDesign', label: 'Advance Design', path: '/template/advance-designer', icon: Layout },
        { id: 'aiTemplateDesign', label: 'AI Design', path: '/template/ai-studio', icon: Cpu },
        { id: 'templateLibrary', label: 'Library', path: '/template/library', icon: Archive },
        { id: 'formBuilder', label: 'Form Builder', path: '/template/form-list', icon: ClipboardList },
        { id: 'templateMarketPlace', label: 'Marketplace', path: '/template/marketplace', icon: ShoppingCart },
        { id: 'templateAnlytics', label: 'Anlytics', path: '/template/anylytics', icon: BarChart3 },
        { id: 'apiManagement', label: 'API Management', path: '/template/api-management', icon: Code },
        { id: 'workflowAutomation', label: 'Workflow', path: '/template/automation', icon: Zap },
        { id: 'templateAdminDashboard', label: 'Admin Dashboard', path: '/template/admin-dashboard', icon: Settings },
      ]
    },
    {
      id: 'pdf-tools',
      label: 'PDF Tools',
      icon: Scissors,
      children: [
        { id: 'all', label: 'All Tools', path: '/pdf-tools', icon: FileText },
        { id: 'conversion', label: 'Conversion', path: '/pdf-tools?category=conversion', icon: Repeat },
        { id: 'editing', label: 'Editing', path: '/pdf-tools?category=editing', icon: Edit3 },
        { id: 'pages', label: 'Page Management', path: '/pdf-tools?category=pages', icon: Copy },
        { id: 'security', label: 'Security', path: '/pdf-tools?category=security', icon: Lock },
        { id: 'optimization', label: 'Optimization', path: '/pdf-tools?category=optimization', icon: Settings },
        { id: 'ocr', label: 'OCR & Text', path: '/pdf-tools?category=ocr', icon: Search },
        { id: 'forms', label: 'Forms', path: '/pdf-tools?category=forms', icon: FileSpreadsheet },
        { id: 'utilities', label: 'Utilities', path: '/pdf-tools?category=utilities', icon: Wrench }
      ]
    },
     {
      id: 'API-Keys',
      label: 'API Keys',
      icon: Key,
      children: [
        { id: 'dashboard', label: 'Dashboard', path: '/api-service/dashboard', icon: LayoutDashboardIcon },
        { id: 'explorer', label: 'API Explorer', path: '/api-service/explorer', icon: Play },
        { id: 'documentation', label: 'Documentation', path: '/api-service/documentation', icon: Book },
        { id: 'Projects', label: 'Projects', path: '/api-service/projects',icon: FolderOpen },
        { id: 'key',label: 'Api Keys', path:'/api-service/keys', icon: Key },
        { id: 'webhooks', label: 'Webhooks', path: '/api-service/webhooks', icon: Webhook },
        { id: 'sdks', label: 'SDKs', path: '/api-service/sdk', icon: Package },
        { id: 'testing', label: 'Testing', path: '/api-service/testing', icon: TestTube },
        { id: 'analytics', label: 'Analytics', path: '/api-service/analytics', icon: BarChart3 },
        { id: 'marketplace', label: 'Marketplace',  path: '/api-service/marketplace', icon: Store },
        { id: 'community', label: 'Community', path: '/api-service/community', icon: Users },
        { id: 'support', label: 'Support', path: '/api-service/support', icon: HelpCircle },
      ]
    },
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
    <div className={`bg-gray-100 shadow-lg transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'}`}>
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
              className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''
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
                className={`w-full text-[14px] flex items-center justify-between px-3 py-2.5 text-left transition-all duration-200 ${activeView === item.id
                  ? 'bg-gray-300 text-black-700 border-r-2 border-gray-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                style={{ cursor: 'pointer' }}
              >
                <div className="flex items-center space-x-3">
                  {item.icon && (
                    <item.icon
                      className={`h-5 w-5 ${activeView === item.id ? 'text-xs text-primary-600' : 'text-xs text-gray-400'
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
                  {item.children.map((sub) => {

                    const isSendEnvelope = sub.id === "create";   // ✅ only for Send Envelope
                    const isActive = activeView === sub.id;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleNavigation(sub.path, sub.id)}
                        className={`
                          text-xs w-full flex items-center px-3 py-2 text-sm transition-all duration-200
                          ${isSendEnvelope
                            ? "send-envelope text-white hover:bg-brandPurple-900"     // ✅ Dark for only Send Envelope
                            : isActive
                              ? "bg-gray-300 text-black"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                          }
                              `}
                        style={{ 
                          cursor: 'pointer',
                          ...(isSendEnvelope && { backgroundColor: '#260559' })
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          {sub.icon && (
                            <sub.icon
                              className={`h-4 w-4 
                  ${isSendEnvelope ? "text-white" :
                                  isActive ? "text-primary-600" : "text-gray-400"}
                `}
                            />
                          )}
                          <span>{sub.label}</span>
                        </div>
                      </button>
                    );
                  })}
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
