import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  Copy,
  Edit3,
  Clock,
  Users,
  Zap,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { workflowTemplateAPI } from '../../services/workflowService';
import type { WorkflowTemplate, WorkflowStep } from '../../services/workflowService';
import { WorkflowExecutionModal } from './WorkflowExecutionModal';

// Remove duplicate interface - using imported WorkflowStep and WorkflowTemplate

interface WorkflowDesignerProps {
  onBack: () => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({ onBack }) => {
  const [workflows, setWorkflows] = useState<WorkflowTemplate[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Only show tools that are actually implemented in the backend
  const supportedTools = [
    // PDF Conversion Tools
    { id: 'pdf-to-word', name: 'PDF to Word', description: 'Convert PDF to Word document', icon: 'FileText', category: 'conversion' },
    { id: 'word-to-pdf', name: 'Word to PDF', description: 'Convert Word document to PDF', icon: 'FileText', category: 'conversion' },
    { id: 'pdf-to-excel', name: 'PDF to Excel', description: 'Convert PDF to Excel spreadsheet', icon: 'FileSpreadsheet', category: 'conversion' },
    { id: 'excel-to-pdf', name: 'Excel to PDF', description: 'Convert Excel spreadsheet to PDF', icon: 'FileSpreadsheet', category: 'conversion' },
    { id: 'pdf-to-ppt', name: 'PDF to PowerPoint', description: 'Convert PDF to PowerPoint presentation', icon: 'Presentation', category: 'conversion' },
    { id: 'ppt-to-pdf', name: 'PowerPoint to PDF', description: 'Convert PowerPoint presentation to PDF', icon: 'Presentation', category: 'conversion' },
    { id: 'pdf-to-text', name: 'PDF to Text', description: 'Extract text from PDF', icon: 'FileText', category: 'conversion' },
    { id: 'text-to-pdf', name: 'Text to PDF', description: 'Convert text file to PDF', icon: 'FileText', category: 'conversion' },
    { id: 'pdf-to-html', name: 'PDF to HTML', description: 'Convert PDF to HTML', icon: 'Globe', category: 'conversion' },
    { id: 'pdf-to-epub', name: 'PDF to EPUB', description: 'Convert PDF to EPUB ebook', icon: 'BookOpen', category: 'conversion' },
    { id: 'pdf-to-image', name: 'PDF to Image', description: 'Convert PDF to image (PNG)', icon: 'Image', category: 'conversion' },
    
    // PDF Optimization Tools
    { id: 'compress-pdf', name: 'Compress PDF', description: 'Reduce PDF file size', icon: 'Minimize2', category: 'optimization' },
    { id: 'optimize-image', name: 'Optimize Images', description: 'Optimize images in PDF', icon: 'Image', category: 'optimization' },
    { id: 'optimize-font', name: 'Optimize Fonts', description: 'Optimize fonts in PDF', icon: 'Type', category: 'optimization' },
    { id: 'remove-unused-objects', name: 'Remove Unused Objects', description: 'Remove unused objects from PDF', icon: 'Trash2', category: 'optimization' },
    { id: 'linearize-pdf', name: 'Linearize PDF', description: 'Optimize PDF for web viewing', icon: 'Zap', category: 'optimization' },
    { id: 'color-optimization', name: 'Color Optimization', description: 'Optimize colors in PDF', icon: 'Palette', category: 'optimization' },
    { id: 'remove-metadata', name: 'Remove Metadata', description: 'Remove metadata from PDF', icon: 'Shield', category: 'optimization' },
    
    // OCR and Text Tools
    { id: 'ocr', name: 'OCR', description: 'Extract text from images using OCR', icon: 'Eye', category: 'text' },
    { id: 'make-searchable', name: 'Make Searchable', description: 'Make PDF text searchable', icon: 'Search', category: 'text' },
    
  
   
  ];

  // Load workflows on component mount
  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await workflowTemplateAPI.getWorkflowTemplates();
      if (response.success) {
        setWorkflows(response.data);
      } else {
        setError('Failed to load workflows');
      }
    } catch (err) {
      console.error('Error loading workflows:', err);
      setError('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  const createNewWorkflow = () => {
    const newWorkflow: WorkflowTemplate = {
      _id: `wf_${Date.now()}`,
      name: 'New Workflow',
      description: 'Custom workflow description',
      steps: [],
      isTemplate: true,
      isPublic: false,
      createdBy: '',
      createdByName: '',
      category: 'custom',
      tags: [],
      usage: 0,
      avgTime: '0 minutes',
      metadata: {
        complexity: 'easy',
        inputFormats: [],
        outputFormats: [],
        features: []
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setWorkflows(prev => [newWorkflow, ...prev]);
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
    setHasUnsavedChanges(false); // New workflow starts with no unsaved changes
  };

  const addStepToWorkflow = (toolId: string) => {
    if (!selectedWorkflow) return;

    const tool = supportedTools.find(t => t.id === toolId);
    if (!tool) return;

    const newStep: WorkflowStep = {
      id: `step_${Date.now()}`,
      toolId,
      name: tool.name,
      order: selectedWorkflow.steps.length + 1
    };

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: [...selectedWorkflow.steps, newStep]
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(wf => wf._id === selectedWorkflow._id ? updatedWorkflow : wf));
    setHasUnsavedChanges(true);
  };

  const removeStep = (stepId: string) => {
    if (!selectedWorkflow) return;

    const updatedSteps = selectedWorkflow.steps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: updatedSteps
    };

    setSelectedWorkflow(updatedWorkflow);
    setWorkflows(prev => prev.map(wf => wf._id === selectedWorkflow._id ? updatedWorkflow : wf));
    setHasUnsavedChanges(true);
  };

  const duplicateWorkflow = async (workflow: WorkflowTemplate) => {
    try {
      setLoading(true);
      const response = await workflowTemplateAPI.duplicateWorkflowTemplate(workflow._id);
      if (response.success) {
        setWorkflows(prev => [response.data, ...prev]);
      } else {
        setError('Failed to duplicate workflow');
      }
    } catch (err) {
      console.error('Error duplicating workflow:', err);
      setError('Failed to duplicate workflow');
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (workflowId: string) => {
    try {
      setLoading(true);
      const response = await workflowTemplateAPI.deleteWorkflowTemplate(workflowId);
      if (response.success) {
        setWorkflows(prev => prev.filter(wf => wf._id !== workflowId));
        if (selectedWorkflow?._id === workflowId) {
          setSelectedWorkflow(null);
          setIsEditing(false);
        }
      } else {
        setError('Failed to delete workflow');
      }
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setError('Failed to delete workflow');
    } finally {
      setLoading(false);
    }
  };

  const getToolIcon = (toolId: string) => {
    const tool = supportedTools.find(t => t.id === toolId);
    if (!tool) return Icons.FileText;
    return (Icons as any)[tool.icon] || Icons.FileText;
  };

  const saveWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      setLoading(true);
      setError(null);

      let response;
      if (selectedWorkflow._id.startsWith('wf_')) {
        // New workflow - create it
        response = await workflowTemplateAPI.createWorkflowTemplate({
          name: selectedWorkflow.name,
          description: selectedWorkflow.description,
          steps: selectedWorkflow.steps,
          category: selectedWorkflow.category,
          tags: selectedWorkflow.tags,
          isPublic: selectedWorkflow.isPublic,
          metadata: selectedWorkflow.metadata
        });
      } else {
        // Existing workflow - update it
        response = await workflowTemplateAPI.updateWorkflowTemplate(selectedWorkflow._id, selectedWorkflow);
      }

      if (response.success) {
        setWorkflows(prev => prev.map(wf => wf._id === selectedWorkflow._id ? response.data : wf));
        setSelectedWorkflow(response.data);
        setIsEditing(false);
        setHasUnsavedChanges(false);
      } else {
        setError('Failed to save workflow');
      }
    } catch (err) {
      console.error('Error saving workflow:', err);
      setError('Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleRunWorkflow = () => {
    if (selectedWorkflow && selectedWorkflow.steps.length > 0) {
      setShowExecutionModal(true);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Workflow Designer</h1>
              <p className="text-gray-600">Create and manage custom PDF processing workflows</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {loading && <Loader2 className="w-5 h-5 animate-spin" />}
            <button
              onClick={createNewWorkflow}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
              <span>New Workflow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-4">
          <div className="flex">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Workflows List */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Workflows ({workflows.length})
            </h3>
            
            <div className="space-y-3">
              {workflows.map((workflow) => (
                <div
                  key={workflow._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorkflow?._id === workflow._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setIsEditing(false);
                    setHasUnsavedChanges(false); // Reset unsaved changes when switching workflows
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-gray-900">{workflow.name}</h4>
                        {workflow.isTemplate && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                            Template
                          </span>
                        )}
                        {workflow.isPublic && (
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                            Public
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateWorkflow(workflow);
                        }}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(workflow._id);
                        }}
                        disabled={loading}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{workflow.usage}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{workflow.avgTime}</span>
                      </span>
                    </div>
                    <span>{workflow.steps.length} steps</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Designer Area */}
        <div className="flex-1 flex flex-col">
          {selectedWorkflow ? (
            <>
              {/* Workflow Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      {isEditing ? (
                        <input
                          type="text"
                          value={selectedWorkflow.name}
                          onChange={(e) => {
                            const updated = { ...selectedWorkflow, name: e.target.value };
                            setSelectedWorkflow(updated);
                            setWorkflows(prev => prev.map(wf => wf._id === updated._id ? updated : wf));
                            setHasUnsavedChanges(true);
                          }}
                          className="text-xl font-bold text-gray-900 border-b border-gray-300 bg-transparent focus:outline-none focus:border-blue-500"
                        />
                      ) : (
                        <h2 className="text-xl font-bold text-gray-900">{selectedWorkflow.name}</h2>
                      )}
                      {isEditing ? (
                        <textarea
                          value={selectedWorkflow.description}
                          onChange={(e) => {
                            const updated = { ...selectedWorkflow, description: e.target.value };
                            setSelectedWorkflow(updated);
                            setWorkflows(prev => prev.map(wf => wf._id === updated._id ? updated : wf));
                            setHasUnsavedChanges(true);
                          }}
                          className="text-gray-600 mt-1 w-full border border-gray-300 rounded px-2 py-1 text-sm"
                          rows={2}
                        />
                      ) : (
                        <p className="text-gray-600 mt-1">{selectedWorkflow.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditing(!isEditing)}
                      disabled={loading}
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isEditing ? 'Done' : 'Edit'}</span>
                    </button>
                    {/* Only show Run Workflow button if workflow is saved (not a new unsaved workflow) */}
                    {!selectedWorkflow._id.startsWith('wf_') ? (
                      <button 
                        onClick={handleRunWorkflow}
                        disabled={loading || !selectedWorkflow.steps.length}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        <Play className="w-4 h-4" />
                        <span>Run Workflow</span>
                      </button>
                    ) : (
                     ''
                    )}
                    {/* Only show Save button when there are unsaved changes */}
                    {hasUnsavedChanges && (
                      <button 
                        onClick={saveWorkflow}
                        disabled={loading}
                        className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="max-w-4xl mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">
                    Workflow Steps ({selectedWorkflow.steps.length})
                  </h3>

                  {selectedWorkflow.steps.length === 0 ? (
                    <div className="text-center py-12">
                      <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No steps yet</h4>
                      <p className="text-gray-600 mb-4">Add tools to create your workflow</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedWorkflow.steps.map((step) => {
                        const Icon = getToolIcon(step.toolId);
                        const tool = supportedTools.find(t => t.id === step.toolId);
                        
                        return (
                          <div key={step.id} className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                              {step.order}
                            </div>
                            
                            <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                                    <Icon className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{step.name}</h4>
                                    <p className="text-sm text-gray-600">{tool?.description}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                
                                  {isEditing && (
                                    <button
                                      onClick={() => removeStep(step.id)}
                                      disabled={loading}
                                      className="p-2 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a workflow</h3>
                <p className="text-gray-600">Choose a workflow to view and edit its steps</p>
              </div>
            </div>
          )}
        </div>

        {/* Tools Panel */}
        {isEditing && selectedWorkflow && (
          <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Tools</h3>
              
              {['conversion', 'optimization', 'text'].map((category) => {
                const categoryTools = supportedTools.filter(tool => tool.category === category);
                const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
                
                return (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">{categoryName} Tools</h4>
                    <div className="space-y-2">
                      {categoryTools.map((tool) => {
                        const Icon = (Icons as any)[tool.icon] || Icons.FileText;
                        return (
                          <button
                            key={tool.id}
                            onClick={() => addStepToWorkflow(tool.id)}
                            disabled={loading}
                            className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                              <Icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{tool.name}</div>
                              <div className="text-xs text-gray-500 truncate">{tool.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Workflow Execution Modal */}
      <WorkflowExecutionModal
        isOpen={showExecutionModal}
        onClose={() => setShowExecutionModal(false)}
        workflow={selectedWorkflow}
      />
    </div>
  );
};