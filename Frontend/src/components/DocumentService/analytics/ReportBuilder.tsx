import React, { useState } from 'react';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  Filter, 
  Settings,
  Plus,
  Trash2,
  Eye,
  Save
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface ReportWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'text';
  title: string;
  dataSource: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  widgets: ReportWidget[];
  filters: any[];
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
  };
}

interface ReportBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReport: (report: ReportTemplate) => void;
  existingReport?: ReportTemplate;
}

const WIDGET_TYPES = [
  {
    type: 'chart',
    label: 'Chart',
    icon: BarChart3,
    description: 'Bar, line, pie charts'
  },
  {
    type: 'metric',
    label: 'Metric',
    icon: BarChart3,
    description: 'Single value metrics'
  },
  {
    type: 'table',
    label: 'Table',
    icon: BarChart3,
    description: 'Data tables'
  },
  {
    type: 'text',
    label: 'Text',
    icon: BarChart3,
    description: 'Custom text blocks'
  }
];

const DATA_SOURCES = [
  { id: 'documents', label: 'Document Metrics' },
  { id: 'collaboration', label: 'Collaboration Data' },
  { id: 'workflows', label: 'Workflow Analytics' },
  { id: 'users', label: 'User Activity' },
  { id: 'storage', label: 'Storage Usage' }
];

export function ReportBuilder({
  isOpen,
  onClose,
  onSaveReport,
  existingReport
}: ReportBuilderProps) {
  const [report, setReport] = useState<ReportTemplate>(
    existingReport || {
      id: '',
      name: '',
      description: '',
      widgets: [],
      filters: []
    }
  );

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showWidgetConfig, setShowWidgetConfig] = useState(false);

  if (!isOpen) return null;

  const addWidget = (type: string) => {
    const newWidget: ReportWidget = {
      id: `widget-${Date.now()}`,
      type: type as any,
      title: `New ${type}`,
      dataSource: 'documents',
      config: {},
      position: { x: 0, y: 0, w: 4, h: 3 }
    };

    setReport(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
  };

  const removeWidget = (widgetId: string) => {
    setReport(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId)
    }));
  };

  const updateWidget = (widgetId: string, updates: Partial<ReportWidget>) => {
    setReport(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      )
    }));
  };

  const handleSave = () => {
    if (!report.name.trim()) {
      alert('Please enter a report name');
      return;
    }

    const reportToSave = {
      ...report,
      id: report.id || `report-${Date.now()}`
    };

    onSaveReport(reportToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {existingReport ? 'Edit Report' : 'Create Custom Report'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={onClose} variant="ghost" size="sm">
              ×
            </Button>
          </div>
        </div>

        <div className="flex h-[80vh]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-200 overflow-y-auto">
            {/* Report Settings */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Report Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Report Name
                  </label>
                  <Input
                    value={report.name}
                    onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter report name..."
                    size="sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={report.description}
                    onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe this report..."
                    className="w-full p-2 border border-gray-300 rounded text-sm"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Widget Library */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Widgets</h3>
              <div className="space-y-2">
                {WIDGET_TYPES.map((widget) => {
                  const Icon = widget.icon;
                  return (
                    <button
                      key={widget.type}
                      onClick={() => addWidget(widget.type)}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left"
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">
                          {widget.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{widget.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                <Button size="sm" variant="ghost">
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              <div className="space-y-2">
                <div className="p-2 border border-gray-200 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <span>Date Range</span>
                    <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <div className="p-2 border border-gray-200 rounded text-sm">
                  <div className="flex items-center justify-between">
                    <span>Document Type</span>
                    <Button size="sm" variant="ghost" className="h-4 w-4 p-0">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Canvas */}
          <div className="flex-1 overflow-auto">
            <div className="p-6">
              {report.widgets.length === 0 ? (
                <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Start Building Your Report
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add widgets from the sidebar to create your custom report
                    </p>
                    <Button onClick={() => addWidget('chart')}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Widget
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-4">
                  {report.widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={`col-span-${widget.position.w} border border-gray-200 rounded-lg p-4 relative group`}
                    >
                      {/* Widget Header */}
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium text-gray-900">
                          {widget.title}
                        </h4>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedWidget(widget.id);
                              setShowWidgetConfig(true);
                            }}
                            className="h-6 w-6 p-0"
                          >
                            <Settings className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeWidget(widget.id)}
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Widget Content */}
                      <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
                        <div className="text-center">
                          <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            {widget.type.charAt(0).toUpperCase() + widget.type.slice(1)} Widget
                          </p>
                          <p className="text-xs text-gray-400">
                            Data: {DATA_SOURCES.find(ds => ds.id === widget.dataSource)?.label}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              Save Report
            </Button>
          </div>
        </div>

        {/* Widget Configuration Modal */}
        {showWidgetConfig && selectedWidget && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Configure Widget
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Widget Title
                  </label>
                  <Input
                    value={report.widgets.find(w => w.id === selectedWidget)?.title || ''}
                    onChange={(e) => updateWidget(selectedWidget, { title: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data Source
                  </label>
                  <select
                    value={report.widgets.find(w => w.id === selectedWidget)?.dataSource || ''}
                    onChange={(e) => updateWidget(selectedWidget, { dataSource: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    {DATA_SOURCES.map((source) => (
                      <option key={source.id} value={source.id}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWidgetConfig(false);
                    setSelectedWidget(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setShowWidgetConfig(false);
                    setSelectedWidget(null);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}