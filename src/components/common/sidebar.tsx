import React from 'react';
import { 
  LayoutDashboard, 
  Shield, 
  FileSearch, 
  AlertTriangle, 
  BarChart3, 
  FileText, 
  GraduationCap, 
  Settings,
  ChevronLeft,
  Building2,
  Lock,
  Globe,
  CheckSquare,
  Archive,
  Network,
  UserCog
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: any) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeView, 
  setActiveView, 
  isOpen, 
  setIsOpen 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'compliance', label: 'Compliance', icon: Shield },
    { id: 'audit', label: 'Audit Trail', icon: FileSearch },
    { id: 'risk', label: 'Risk Management', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reporting', label: 'Reporting', icon: FileText },
    { id: 'data-privacy', label: 'Data Privacy', icon: Lock },
    { id: 'regulatory-intelligence', label: 'Regulatory Intel', icon: Globe },
    { id: 'compliance-assessment', label: 'Assessment', icon: CheckSquare },
    { id: 'evidence-management', label: 'Evidence', icon: Archive },
    { id: 'grc-integrations', label: 'GRC Integrations', icon: Network },
    { id: 'training', label: 'Training', icon: GraduationCap },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'admin', label: 'Admin Portal', icon: UserCog },
  ];

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
                <p className="text-xs text-gray-500">Enterprise Compliance</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            <ChevronLeft className={`h-5 w-5 text-gray-500 transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
                activeView === item.id
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className={`h-5 w-5 ${activeView === item.id ? 'text-primary-600' : 'text-gray-400'}`} />
              {isOpen && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        {isOpen && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-primary-50 rounded-lg p-3">
              <p className="text-sm font-medium text-primary-800">Phase 7A</p>
              <p className="text-xs text-primary-600">Compliance & Analytics</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};