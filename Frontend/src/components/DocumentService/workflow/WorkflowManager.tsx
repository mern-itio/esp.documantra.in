import { useState } from 'react';
import { 
  Workflow, 
  Play, 
  Pause, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  User,
  Calendar,
  Plus,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { WorkflowDesigner } from './WorkflowDesigner';
import type { DocumentWorkflow } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';
import { workflowAPI } from '../../../services/api';
import { useAuth } from '../../AuthService/AuthContext';

interface WorkflowManagerProps {
  documentId: string;
  workflows: DocumentWorkflow[];
  onWorkflowCreate: (workflow: Omit<DocumentWorkflow, 'id' | 'createdAt'>) => void;
  onWorkflowUpdate: (workflowId: string, updates: Partial<DocumentWorkflow>) => void;
  onStepComplete: (workflowId: string, stepId: string) => void;
}

export function WorkflowManager({
  documentId,
  workflows,
  onWorkflowCreate,
  // onWorkflowUpdate,
  onStepComplete
}: WorkflowManagerProps) {
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <Pause className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'rejected':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle workflow creation with real API
  const handleWorkflowCreate = async (workflow: Omit<DocumentWorkflow, 'id' | 'createdAt'>) => {
    try {
      setIsLoading(true);
      const response = await workflowAPI.createWorkflow(documentId, workflow);
      
      if (response.success) {
        console.log('✅ Workflow created successfully:', response.data);
        // Call the parent callback to refresh workflows
        if (onWorkflowCreate) {
          await onWorkflowCreate(workflow);
        }
        setShowDesigner(false);
      } else {
        console.error('❌ Failed to create workflow:', response.message);
        alert(`Failed to create workflow: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      alert('An error occurred while creating the workflow');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle workflow step completion with real API
  const handleStepComplete = async (workflowId: string, stepId: string, status: string, comments?: string) => {
    try {
      setIsLoading(true);
      const response = await workflowAPI.completeWorkflowStep(workflowId, stepId, {
        status: status as 'pending' | 'in_progress' | 'completed' | 'rejected',
        comments
      });
      
      if (response.success) {
        console.log('✅ Workflow step completed successfully:', response.data);
        // Call the parent callback to refresh workflows
        if (onStepComplete) {
          await onStepComplete(workflowId, stepId);
        }
      } else {
        console.error('❌ Failed to complete workflow step:', response.message);
        alert(`Failed to complete step: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Error completing workflow step:', error);
      alert('An error occurred while completing the step');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Workflow className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">Document Workflows</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
              {workflows.length} workflows
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDesigner(true)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Designer
            </Button>
            <Button
              onClick={() => setShowDesigner(true)}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Workflow
            </Button>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="divide-y divide-gray-200">
        {workflows.length === 0 ? (
          <div className="p-8 text-center">
            <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
            <p className="text-gray-500 mb-4">
              Create your first workflow to automate document processes
            </p>
            <Button onClick={() => setShowDesigner(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        ) : (
          workflows.map((workflow) => (
            <div key={workflow.id} className="p-4">
              {/* Workflow Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(workflow.status)}
                    <h4 className="text-lg font-medium text-gray-900">
                      {workflow.name}
                    </h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(workflow.priority)}`}>
                      {workflow.priority}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>Created by {workflow.createdBy}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(workflow.createdAt)}</span>
                    </div>
                    {workflow.deadline && (
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>Due {formatDate(workflow.deadline)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedWorkflow(
                      selectedWorkflow === workflow.id ? null : workflow.id
                    )}
                  >
                    {selectedWorkflow === workflow.id ? 'Hide Details' : 'Show Details'}
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Progress</span>
                  <span className="text-gray-600">
                    {workflow.steps.filter(s => s.status === 'completed').length} / {workflow.steps.length} steps
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              {/* Workflow Steps (Expanded) */}
              {selectedWorkflow === workflow.id && (
                <div className="mt-4 space-y-3">
                  <h5 className="text-sm font-medium text-gray-900">Workflow Steps</h5>
                  {workflow.steps.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          {getStepStatusIcon(step.status)}
                          <span className="text-sm font-medium text-gray-900">
                            {step.name}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            step.status === 'completed' ? 'bg-green-100 text-green-800' :
                            step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            step.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {step.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-1">{step.description}</p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Assigned to: {step.assigneeName}</span>
                          {step.dueDate && (
                            <span>Due: {formatDate(step.dueDate)}</span>
                          )}
                          {step.completedAt && (
                            <span>Completed: {formatDate(step.completedAt)}</span>
                          )}
                        </div>
                      </div>

                      {/* Step Actions */}
                      <div className="flex items-center space-x-2">
                        {step.status === 'pending' && step.assignee === user?.email && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStepComplete(workflow.id, step.id, 'in_progress')}
                              disabled={isLoading}
                            >
                              Start
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStepComplete(workflow.id, step.id, 'completed')}
                              disabled={isLoading}
                            >
                              Complete
                            </Button>
                          </div>
                        )}
                        
                        {step.status === 'in_progress' && step.assignee === user?.email && (
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              onClick={() => handleStepComplete(workflow.id, step.id, 'completed')}
                              disabled={isLoading}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStepComplete(workflow.id, step.id, 'rejected')}
                              disabled={isLoading}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                        
                        {step.status === 'completed' && (
                          <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                        )}
                        
                        {step.status === 'rejected' && (
                          <span className="text-red-600 text-sm font-medium">✗ Rejected</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Workflow Designer Modal */}
      {showDesigner && (
        <WorkflowDesigner
          documentId={documentId}
          onClose={() => setShowDesigner(false)}
          onSave={handleWorkflowCreate}
        />
      )}
    </div>
  );
}