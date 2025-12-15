import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { FileText, ChevronLeft, ChevronDown, ChevronRight, Building2, FileSignature, Scissors, Repeat, Edit3, Copy, Settings, Search, FileSpreadsheet, Wrench, Lock, Clock, Star, Share2, Archive, Folder, Trash2, File, Mail, FileEdit, Pencil, CheckCircle, Trash2Icon, FormInput, Send, Plus, HelpCircle, CreditCard, Share } from 'lucide-react';

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

// Component for menu item with tooltip
const MenuItemButton: React.FC<{
  item: MenuItem;
  isOpen: boolean;
  isMainMenuActive: boolean;
  expandedMenu: string | null;
  handleMainMenuClick: (item: MenuItem) => void;
}> = ({ item, isOpen, isMainMenuActive, expandedMenu, handleMainMenuClick }) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          // Use sidebar width (64px when collapsed) + small margin
          setTooltipPosition({
            top: rect.top + rect.height / 2,
            left: 64 + 8  // Sidebar width (64px) + 8px margin
          });
        }
      };
      updatePosition();
      // Update on scroll and resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        onClick={() => handleMainMenuClick(item)}
        className={`group/btn w-full text-[14px] flex items-center justify-between px-2.5 py-2.5 rounded-lg text-left transition-all duration-300 ${isMainMenuActive
          ? 'bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white shadow-md'
          : 'text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent hover:text-slate-900 hover:shadow-sm'
          }`}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center space-x-3">
          {item.icon && (
            <item.icon
              className={`h-5 w-5 transition-all duration-300 ${
                isMainMenuActive 
                  ? 'text-white group-hover/btn:scale-110 group-hover/btn:rotate-3' 
                  : 'text-slate-400 group-hover/btn:text-[#3E2B66] group-hover/btn:scale-110 group-hover/btn:rotate-3'
              }`}
            />
          )}
          {isOpen && <span className="font-medium transition-all duration-300">{item.label}</span>}
        </div>
        {item.children && isOpen && (
          expandedMenu === item.id ? (
            <ChevronDown className={`h-4 w-4 transition-all duration-300 ${isMainMenuActive ? 'text-white' : 'text-slate-400'} group-hover/btn:scale-110`} />
          ) : (
            <ChevronRight className={`h-4 w-4 transition-all duration-300 ${isMainMenuActive ? 'text-white' : 'text-slate-400'} group-hover/btn:scale-110 group-hover/btn:translate-x-1`} />
          )
        )}
      </button>
      
      {/* Tooltip for collapsed sidebar */}
      {!isOpen && tooltipPosition.left > 0 && (
        <div 
          className="fixed px-3 py-1.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999] opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none transform scale-95 group-hover:scale-100"
          style={{ 
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`,
            transform: 'translateY(-50%)'
          }}
        >
          {item.label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#3E2B66]"></div>
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  activeView = 'dashboard',
  setActiveView = () => { },
  isOpen = true,
  setIsOpen = () => { }
}) => {
 const [expandedMenu, setExpandedMenu] = useState<string | null>("e-sign");
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
      if (pathname.startsWith('/e-sign/aggrement/shared-with-me')) return 'shared-with-me';
      if (pathname.startsWith('/e-sign/create')) return 'create';
      if (pathname.startsWith('/e-sign/powerform')) return 'powerforms';
      if (pathname.startsWith('/e-sign/form-list')) return 'form-list';
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

    // Collapse sidebar when on /e-sign/create
    if (
      location.pathname.startsWith('/e-sign/create') ||
      location.pathname.startsWith('/e-sign/powerforms')
    ) {
      setIsOpen(false);
    }
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
  }, [location.pathname, setActiveView, setIsOpen]);

  const menuItems: MenuItem[] = [
    // { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    {
      id: 'e-sign',
      label: 'E-Sign',
      icon: FileSignature,
      children: [
        { id: 'create', label: 'Create Envelope', path: '/e-sign/create', icon: Plus },
        { id: 'esignDashboard', label: 'All Agreement', path: '/e-sign/aggrement', icon: Mail },
        { id: 'esignDraft', label: 'Drafts', path: '/e-sign/aggrement/draft', icon: FileEdit },
        { id: 'esignInProgress', label: 'In Progress', path: '/e-sign/aggrement/in-progress', icon: Pencil },
        { id: 'esignCompleted', label: 'Completed', path: '/e-sign/aggrement/completed', icon: CheckCircle },
        { id: 'shared-with-me', label: 'Shared With Me', path: '/e-sign/aggrement/shared-with-me', icon: Share },
        { id: 'esignDeleted', label: 'Deleted', path: '/e-sign/aggrement/deleted', icon: Trash2Icon },
        // { id: 'sent', label: 'Add Envelope', path: '/e-sign/sent', icon: MailPlus },
        { id: 'powerforms', label: 'PowerForms', path: '/e-sign/powerform', icon: FormInput },
        { id: 'form-list', label: 'Templates', path: '/e-sign/form-list', icon: Send },
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

    // {
    //   id: 'template',
    //   label: 'Template',
    //   icon: Layers,
    //   children: [
    //     { id: 'templateDashboard', label: 'Dashboard', path: '/template/dashboard', icon: LayoutDashboardIcon },
    //     { id: 'templateDesign', label: 'Design', path: '/template/designer', icon: Edit3 },
    //     { id: 'advanceTemplateDesign', label: 'Advance Design', path: '/template/advance-designer', icon: Layout },
    //     { id: 'aiTemplateDesign', label: 'AI Design', path: '/template/ai-studio', icon: Cpu },
    //     { id: 'templateLibrary', label: 'Library', path: '/template/library', icon: Archive },
    //     { id: 'formBuilder', label: 'Form Builder', path: '/template/form-list', icon: ClipboardList },
    //     { id: 'templateMarketPlace', label: 'Marketplace', path: '/template/marketplace', icon: ShoppingCart },
    //     { id: 'templateAnlytics', label: 'Anlytics', path: '/template/anylytics', icon: BarChart3 },
    //     { id: 'apiManagement', label: 'API Management', path: '/template/api-management', icon: Code },
    //     { id: 'workflowAutomation', label: 'Workflow', path: '/template/automation', icon: Zap },
    //     { id: 'templateAdminDashboard', label: 'Admin Dashboard', path: '/template/admin-dashboard', icon: Settings },
    //   ]
    // },
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
    //  {
    //   id: 'API-Keys',
    //   label: 'API Keys',
    //   icon: Key,
    //   children: [
    //     { id: 'dashboard', label: 'Dashboard', path: '/api-service/dashboard', icon: LayoutDashboardIcon },
    //     { id: 'explorer', label: 'API Explorer', path: '/api-service/explorer', icon: Play },
    //     { id: 'documentation', label: 'Documentation', path: '/api-service/documentation', icon: Book },
    //     { id: 'Projects', label: 'Projects', path: '/api-service/projects',icon: FolderOpen },
    //     { id: 'key',label: 'Api Keys', path:'/api-service/keys', icon: Key },
    //     { id: 'webhooks', label: 'Webhooks', path: '/api-service/webhooks', icon: Webhook },
    //     { id: 'sdks', label: 'SDKs', path: '/api-service/sdk', icon: Package },
    //     { id: 'testing', label: 'Testing', path: '/api-service/testing', icon: TestTube },
    //     { id: 'analytics', label: 'Analytics', path: '/api-service/analytics', icon: BarChart3 },
    //     { id: 'marketplace', label: 'Marketplace',  path: '/api-service/marketplace', icon: Store },
    //     { id: 'community', label: 'Community', path: '/api-service/community', icon: Users },
    //     { id: 'support', label: 'Support', path: '/api-service/support', icon: HelpCircle },
    //   ]
    // },
  ];

  const toggleSubmenu = (id: string) => {
    setExpandedMenu(prev => (prev === id ? null : id));
  };

  const handleNavigation = (path: string, id: string) => {
    setActiveView(id);
    navigate(path);
  };

  const handleMainMenuClick = (item: MenuItem) => {
    // If sidebar is collapsed, ONLY expand it and expand submenu if it has children
    // Do NOT navigate - user must click on submenu items to navigate
    if (!isOpen) {
      setIsOpen(true);
      // If it has children, expand the submenu but don't navigate
      if (item.children && item.children.length > 0) {
        setExpandedMenu(item.id);
      }
      // Don't navigate when sidebar is collapsed - just expand it
      return;
    }
    
    // Normal behavior when sidebar is open
    if (item.children) {
      toggleSubmenu(item.id);
    } else if (item.path) {
      handleNavigation(item.path, item.id);
    }
  };

  return (
    <div className={`bg-white shadow-lg border-r border-slate-200 transition-all duration-300 ease-in-out ${isOpen ? 'w-64' : 'w-16'} flex flex-col h-full relative overflow-visible`}>
      {/* Header */}
         {/* <div className="bg-[#260559] flex items-center justify-between px-3 py-3 border-b border-slate-200 flex-shrink-0">
        {isOpen && (
          <div className=" flex items-center space-x-2">
            <div>
              <Link to="/dashboard"><img src='../l4.png' alt="Draft&Sign Logo" className="mx-auto" style={{width: '120px', height: 'auto'}}/></Link>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-slate-100 transition-colors duration-200"
        >
          <ChevronLeft
            className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''
              }`}
          />
        </button>
      </div> */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200 flex-shrink-0 bg-gradient-to-r from-white to-slate-50">
        {isOpen && (
          <div className="flex items-center space-x-2 animate-fade-in">
            <Building2 className="h-7 w-7 text-[#3E2B66] transition-transform duration-300 hover:scale-110 hover:rotate-6" />
            <div>
              <Link to="/dashboard"><h1 className="text-base font-semibold text-slate-900 transition-colors duration-300 hover:text-[#3E2B66]">Draft&Sign</h1></Link>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded-md hover:bg-slate-100 transition-colors duration-200"
        >
          <ChevronLeft
            className={`h-5 w-5 text-slate-500 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''
              }`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto min-h-0 overflow-x-visible">
        {menuItems.map((item) => {
          // Check if any child is active
          const hasActiveChild = item.children?.some(child => activeView === child.id) || false;
          const isMainMenuActive = activeView === item.id || hasActiveChild;

          return (
            <div key={item.id}>
              <MenuItemButton 
                item={item}
                isOpen={isOpen}
                isMainMenuActive={isMainMenuActive}
                expandedMenu={expandedMenu}
                handleMainMenuClick={handleMainMenuClick}
              />

              {/* Submenu */}
              {item.children && expandedMenu === item.id && isOpen && (
                <div className="ml-6 mt-1 space-y-1 animate-submenu-slide">
                  {item.children.map((sub, index) => {

                    const isSendEnvelope = sub.id === "create";   // ✅ only for Send Envelope
                    const isActive = activeView === sub.id;

                    return (
                      <div key={sub.id} className={`relative group/sub ${isSendEnvelope ? 'create-envelope-special' : ''}`} style={{ animationDelay: `${index * 30}ms` }}>
                        <button
                          onClick={() => handleNavigation(sub.path, sub.id)}
                          className={`
                              group/btn text-xs w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm relative
                              transition-all duration-300 transform active:scale-100 overflow-hidden
                              ${isSendEnvelope
                              ? "text-[#3E2B66] bg-gradient-to-r from-purple-50 to-indigo-50 hover:border-[#3E2B66] hover:bg-gradient-to-r hover:from-[#3E2B66] hover:to-[#4d3577] hover:text-white hover:shadow-lg hover:scale-[1.05] create-envelope-btn"
                              : isActive
                                ? "bg-gradient-to-r from-indigo-100 to-purple-50 text-[#3E2B66] shadow-sm border-l-4 border-[#3E2B66] hover:scale-[1.02]"
                                : "text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent hover:text-slate-900 hover:shadow-sm hover:scale-[1.02]"
                            }
                                  `}
                          style={{
                            cursor: 'pointer',
                          }}
                        >
                          {/* Special shine effect for Create Envelope */}
                          {isSendEnvelope && (
                            <div className="absolute inset-0 create-envelope-shine"></div>
                          )}
                          {/* Glow effect */}
                          {isSendEnvelope && (
                            <div className="absolute inset-0 create-envelope-glow"></div>
                          )}
                          <div className="flex items-center space-x-2 relative z-10">
                            {sub.icon && (
                              <sub.icon
                                className={`h-4 w-4 transition-all duration-300
                      ${isSendEnvelope 
                        ? "text-[#3E2B66] group-hover/btn:text-white group-hover/btn:scale-125 group-hover/btn:rotate-12 create-envelope-icon" 
                        : isActive 
                          ? "text-[#3E2B66] scale-110" 
                          : "text-slate-500 group-hover/btn:text-[#3E2B66] group-hover/btn:scale-110 group-hover/btn:rotate-6"
                      }
                    `}
                              />
                            )}
                            <span className={`transition-all duration-300 relative z-10 ${isSendEnvelope ? 'text-[#3E2B66] group-hover/btn:text-white font-bold create-envelope-text' : isActive ? 'font-medium text-[#3E2B66]' : 'font-normal'}`}>{sub.label}</span>
                          </div>
                        
                        </button>
                        
                        {/* Tooltip for collapsed sidebar submenu items (if visible) */}
                        {!isOpen && (
                          <div className="absolute left-full ml-2 px-3 py-1.5 bg-gradient-to-r from-[#260559] to-[#3E2B66] text-white text-xs rounded-lg shadow-xl whitespace-nowrap z-[9999] opacity-0 group-hover/sub:opacity-100 transition-all duration-300 pointer-events-none transform scale-95 group-hover/sub:scale-100" style={{ top: '50%', transform: 'translateY(-50%)' }}>
                            {sub.label}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#3E2B66]"></div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom Section - User Profile & Quick Actions */}
      {isOpen && (
        <div className="border-t border-slate-200 bg-slate-50 flex-shrink-0">


          {/* Quick Actions */}
          <div className="px-2 pb-2 space-y-1">
           
            <button
              onClick={() => navigate('/credits-usage')}
              className="group/action w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent hover:text-slate-900 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-100"
            >
              <CreditCard className="h-3.5 w-3.5 text-slate-400 group-hover/action:text-[#3E2B66] group-hover/action:scale-110 transition-all duration-300" />
              <span className="font-medium">Billing & Usage</span>
            </button>
            <button
              onClick={() => navigate('/account/profile')}
              className="group/action w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent hover:text-slate-900 rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-100"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400 group-hover/action:text-[#3E2B66] group-hover/action:scale-110 group-hover/action:rotate-90 transition-all duration-300" />
              <span className="font-medium">Settings</span>
            </button>
          </div>

          {/* Help Section */}
          <div className="px-2 pb-3 pt-2 border-t border-slate-200">

            <Link to='/help-support'>  
            <button
              className="group/action w-full flex items-center space-x-2 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-100"
            >
              <HelpCircle className="h-3.5 w-3.5 group-hover/action:text-[#3E2B66] group-hover/action:scale-110 transition-all duration-300" />
              <span className="font-medium">Help & Support</span>
            </button>
            </Link>
          </div>
        </div>
      )}

    </div>
  );
};

export default Sidebar;
