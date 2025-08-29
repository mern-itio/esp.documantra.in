import React, { useState } from 'react';
import { DesignCanvas } from '../../components/Template/DesignCanvas';
import { ElementLibrary } from '../../components/Template/ElementLibrary';
import { PropertiesPanel } from '../../components/Template/PropertiesPanel';
import { VariableManager } from '../../components/Template/VariableManager';
import { StyleEditor } from '../../components/Template/StyleEditor';
import { ImportExportManager } from '../../components/Template/ImportExportManager';
import { CollaborationTools } from '../../components/Template/CollaborationTools';
import { ValidationEngine } from '../../components/Template/ValidationEngine';
import { ConditionalLogic } from '../../components/Template/ConditionalLogic';
import { IntegrationHub } from '../../components/Template/IntegrationHub';
import { 
  Save, 
  Eye, 
  Settings, 
  Users, 
  Code, 
  Palette, 
  FileText, 
  Zap,
  CheckCircle,
  Upload
} from 'lucide-react';

export const AdvancedTemplateDesigner: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'design' | 'variables' | 'styles' | 'validation' | 'logic' | 'collaboration' | 'import' | 'integrations'>('design');
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [canvasElements, setCanvasElements] = useState<any[]>([]);
  const [templateVariables, setTemplateVariables] = useState<any[]>([]);
  type StyleSettingsState = {
  colors: { primary: string; secondary: string; accent: string; text: string; background: string };
  typography: { fontFamily: string; fontSize: string; lineHeight: string; fontWeight: string };
  layout: { margin: string; padding: string; borderRadius: string; borderWidth: string };
  branding: { companyName: string; tagline?: string; logo?: string }; // <-- tagline optional
};
  const [styleSettings, setStyleSettings] = useState<StyleSettingsState>({
    colors: {
      primary: '#3B82F6',
      secondary: '#6B7280',
      accent: '#10B981',
      text: '#1F2937',
      background: '#FFFFFF'
    },
    typography: {
      fontFamily: 'Inter, sans-serif',
      fontSize: '16px',
      lineHeight: '1.5',
      fontWeight: '400'
    },
    layout: {
      margin: '20px',
      padding: '16px',
      borderRadius: '8px',
      borderWidth: '1px'
    },
    branding: {
      companyName: 'Your Company',
      tagline: '',
      logo: ''
    }
  });

  const tabs = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'variables', label: 'Variables', icon: Code },
    { id: 'styles', label: 'Styles', icon: Settings },
    { id: 'validation', label: 'Validation', icon: CheckCircle },
    { id: 'logic', label: 'Logic', icon: Zap },
    { id: 'collaboration', label: 'Collaborate', icon: Users },
    { id: 'import', label: 'Import/Export', icon: Upload },
    { id: 'integrations', label: 'Integrations', icon: FileText }
  ];

  // Mock data for collaboration
  const mockCollaborators = [
    { id: '1', name: 'Sarah Johnson', email: 'sarah@company.com', role: 'editor' as const, status: 'online' as const, lastActive: '2 minutes ago' },
    { id: '2', name: 'Mike Chen', email: 'mike@company.com', role: 'viewer' as const, status: 'offline' as const, lastActive: '1 hour ago' }
  ];

  const mockComments = [
    { id: '1', author: 'Sarah Johnson', content: 'Should we add a signature field here?', timestamp: '2 hours ago', resolved: false },
    { id: '2', author: 'Mike Chen', content: 'The layout looks great!', timestamp: '4 hours ago', resolved: true }
  ];

  const mockValidationRules = [
    { id: '1', field: 'employee_name', type: 'required' as const, message: 'Employee name is required', enabled: true },
    { id: '2', field: 'email', type: 'email' as const, message: 'Please enter a valid email', enabled: true }
  ];

  const mockConditionalRules = [
    {
      id: '1',
      name: 'Show salary field for full-time employees',
      conditions: [{ id: '1', field: 'employment_type', operator: 'equals' as const, value: 'full-time' }],
      actions: [{ type: 'show' as const, target: 'salary' }],
      enabled: true
    }
  ];

  const mockIntegrations = [
    { id: 'salesforce', name: 'Salesforce', description: 'Sync with Salesforce CRM', category: 'crm' as const, icon: Users, status: 'connected' as const },
    { id: 'gmail', name: 'Gmail', description: 'Send via Gmail', category: 'email' as const, icon: FileText, status: 'disconnected' as const }
  ];

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Advanced Template Designer</h2>
          <p className="text-sm text-gray-600 mt-1">Create professional templates with advanced features</p>
        </div>
        
        {/* Tabs */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4 border-t border-gray-200">
            {activeTab === 'design' && (
              <ElementLibrary onElementSelect={(element) => {
                setCanvasElements([...canvasElements, element]);
              }} />
            )}
            
            {activeTab === 'variables' && (
              <VariableManager 
                variables={templateVariables}
                onVariablesChange={setTemplateVariables}
              />
            )}
            
            {activeTab === 'styles' && (
              <StyleEditor 
                styles={styleSettings}
                onStylesChange={setStyleSettings}
              />
            )}
            
            {activeTab === 'validation' && (
              <ValidationEngine 
                rules={mockValidationRules}
                onRulesChange={() => {}}
                onValidate={() => []}
              />
            )}
            
            {activeTab === 'logic' && (
              <ConditionalLogic 
                rules={mockConditionalRules}
                onRulesChange={() => {}}
                availableFields={['employee_name', 'employment_type', 'salary', 'email']}
              />
            )}
            
            {activeTab === 'collaboration' && (
              <CollaborationTools 
                collaborators={mockCollaborators}
                comments={mockComments}
                onInviteUser={() => {}}
                onUpdateRole={() => {}}
                onAddComment={() => {}}
                onResolveComment={() => {}}
              />
            )}
            
            {activeTab === 'import' && (
              <ImportExportManager 
                onImport={() => {}}
                onExport={() => {}}
              />
            )}
            
            {activeTab === 'integrations' && (
              <IntegrationHub 
                integrations={mockIntegrations}
                onConnect={() => {}}
                onDisconnect={() => {}}
                onTest={() => {}}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Advanced Employment Contract</h1>
            <span className="text-sm text-gray-500">Last saved 2 minutes ago</span>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md font-medium">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
            <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
              <Save className="w-4 h-4 mr-2" />
              Save Template
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 p-6 overflow-auto">
          <DesignCanvas 
            elements={canvasElements}
            selectedElement={selectedElement}
            onElementSelect={setSelectedElement}
            onElementsChange={setCanvasElements}
          />
        </div>
      </div>

      {/* Properties Panel */}
      <div className="w-80 bg-white border-l border-gray-200">
        <PropertiesPanel 
          selectedElement={selectedElement}
          onElementUpdate={(updatedElement) => {
            setCanvasElements(elements => 
              elements.map(el => el.id === updatedElement.id ? updatedElement : el)
            );
          }}
        />
      </div>
    </div>
  );
};