import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Plus, 
  Play, 
  Save, 
  Trash2, 
  ArrowRight,
  Settings,
  Copy,
  Edit3,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { mockPDFTools } from '../../data/pdfMockData';

interface WorkflowStep {
  id: string;
  toolId: string;
  name: string;
  order: number;
  settings?: Record<string, any>;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  isTemplate: boolean;
  usage: number;
  avgTime: string;
}

interface WorkflowDesignerProps {
  onBack: () => void;
}

export const WorkflowDesigner: React.FC<WorkflowDesignerProps> = ({ onBack }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    {
      id: 'wf_001',
      name: 'Document Preparation',
      description: 'Complete document preparation workflow',
      steps: [
        { id: 'step_1', toolId: 'ocr_text_recognition', name: 'OCR Processing', order: 1 },
        { id: 'step_2', toolId: 'edit_text', name: 'Edit Text', order: 2 },
        { id: 'step_3', toolId: 'add_password', name: 'Add Security', order: 3 },
        { id: 'step_4', toolId: 'compress_pdf', name: 'Optimize', order: 4 }
      ],
      isTemplate: false,
      usage: 89,
      avgTime: '8 minutes'
    },
    {
      id: 'wf_002',
      name: 'Archive Processing',
      description: 'Batch archive processing workflow',
      steps: [
        { id: 'step_5', toolId: 'merge_pdfs', name: 'Merge Documents', order: 1 },
        { id: 'step_6', toolId: 'add_bookmarks', name: 'Add Navigation', order: 2 },
        { id: 'step_7', toolId: 'compress_pdf', name: 'Compress', order: 3 }
      ],
      isTemplate: true,
      usage: 67,
      avgTime: '4 minutes'
    }
  ]);

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const allTools = Object.values(mockPDFTools).flatMap(category => category.tools);

  const createNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: `wf_${Date.now()}`,
      name: 'New Workflow',
      description: 'Custom workflow description',
      steps: [],
      isTemplate: false,
      usage: 0,
      avgTime: '0 minutes'
    };
    setWorkflows(prev => [newWorkflow, ...prev]);
    setSelectedWorkflow(newWorkflow);
    setIsEditing(true);
  };

  const addStepToWorkflow = (toolId: string) => {
    if (!selectedWorkflow) return;

    const tool = allTools.find(t => t.id === toolId);
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
    setWorkflows(prev => prev.map(wf => wf.id === selectedWorkflow.id ? updatedWorkflow : wf));
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
    setWorkflows(prev => prev.map(wf => wf.id === selectedWorkflow.id ? updatedWorkflow : wf));
  };

  const duplicateWorkflow = (workflow: Workflow) => {
    const duplicated: Workflow = {
      ...workflow,
      id: `wf_${Date.now()}`,
      name: `${workflow.name} (Copy)`,
      usage: 0
    };
    setWorkflows(prev => [duplicated, ...prev]);
  };

  const deleteWorkflow = (workflowId: string) => {
    setWorkflows(prev => prev.filter(wf => wf.id !== workflowId));
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null);
      setIsEditing(false);
    }
  };

  const getToolIcon = (toolId: string) => {
    const tool = allTools.find(t => t.id === toolId);
    if (!tool) return Icons.FileText;
    return (Icons as any)[tool.icon] || Icons.FileText;
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

          <button
            onClick={createNewWorkflow}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Workflow</span>
          </button>
        </div>
      </div>

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
                  key={workflow.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedWorkflow?.id === workflow.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedWorkflow(workflow);
                    setIsEditing(false);
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
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateWorkflow(workflow);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteWorkflow(workflow.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
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
                            setWorkflows(prev => prev.map(wf => wf.id === updated.id ? updated : wf));
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
                            setWorkflows(prev => prev.map(wf => wf.id === updated.id ? updated : wf));
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
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>{isEditing ? 'Done' : 'Edit'}</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                      <Play className="w-4 h-4" />
                      <span>Run Workflow</span>
                    </button>
                    <button className="flex items-center space-x-2 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
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
                      {selectedWorkflow.steps.map((step, index) => {
                        const Icon = getToolIcon(step.toolId);
                        const tool = allTools.find(t => t.id === step.toolId);
                        
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
                                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  {isEditing && (
                                    <button
                                      onClick={() => removeStep(step.id)}
                                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {index < selectedWorkflow.steps.length - 1 && (
                              <ArrowRight className="w-5 h-5 text-gray-400" />
                            )}
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
              
              {Object.entries(mockPDFTools).map(([categoryId, category]) => (
                <div key={categoryId} className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{category.category}</h4>
                  <div className="space-y-2">
                    {category.tools.slice(0, 5).map((tool) => {
                      const Icon = (Icons as any)[tool.icon] || Icons.FileText;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => addStepToWorkflow(tool.id)}
                          className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg transition-colors"
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
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};