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
} from 'lucide-react';
import { Button } from '../ui/button';
import { WorkflowDesigner } from './WorkflowDesigner';
import type { DocumentWorkflow } from '../../common/types/collaboration';
import { formatDate } from '../../common/lib/utils';
import { workflowAPI } from '../../../services/api';
import { useAuth } from '../../AuthService/AuthContext';
// CHANGE: Import the new WorkflowStepModal component
import { WorkflowStepModal } from './WorkflowStepModal';


interface WorkflowManagerProps {
  documentId: string;
  workflows: DocumentWorkflow[];
  onWorkflowUpdate: (workflowId: string, updates: Partial<DocumentWorkflow>) => void;
  onStepComplete: (workflowId: string, stepId: string) => void;
  onWorkflowsRefresh: () => void;
}

export function WorkflowManager({
  documentId,
  workflows,
  onStepComplete:_onStepComplete ,
  onWorkflowsRefresh
}: WorkflowManagerProps) {
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  // CHANGE: Add state for modal step selection
  const [selectedStep, setSelectedStep] = useState<any | null>(null);
  const [selectedStepWorkflow, setSelectedStepWorkflow] = useState<string | null>(null);


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
  const handleWorkflowCreate = async (workflow: Omit<DocumentWorkflow, 'id' | 'createdAt'>): Promise<void> => {
    try {
      if (isLoading) {
        console.log('⚠️ Workflow creation already in progress, skipping...');
        return;
      }
      
      setIsLoading(true);
      const response = await workflowAPI.createWorkflow(documentId, workflow);
      
      if (response.success) {
        console.log('✅ Workflow created successfully:', response.data);
        if (onWorkflowsRefresh) {
          onWorkflowsRefresh();
        }
        setShowDesigner(false);
        alert('Workflow created successfully!');
      } else {
        console.error('❌ Failed to create workflow:', response.message);
        alert(`Failed to create workflow: ${response.message}`);
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error creating workflow:', error);
      alert('An error occurred while creating the workflow');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle workflow step completion/rejection with real API
  const handleStepComplete = async (stepId: string, status: string, comments?: string) => {
    if (!selectedStepWorkflow) {
      console.error('No workflow selected');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await workflowAPI.completeWorkflowStep(selectedStepWorkflow, stepId, {
        status: status as 'pending' | 'in_progress' | 'completed' | 'rejected',
        comments
      });
      
      if (response.success) {
        console.log('✅ Workflow step completed successfully:', response.data);
        
        // Show success alert based on status
        if (status === 'completed') {
          alert('Workflow step completed successfully!');
        } else if (status === 'rejected') {
          alert('Workflow step rejected successfully!');
        }
        
        // Refresh workflows to get updated data
        if (onWorkflowsRefresh) {
          await onWorkflowsRefresh();
        }
        
        // Close modal after completion
        handleCloseStepModal();
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

  // CHANGE: Check if current user is the workflow creator
  const isWorkflowCreator = (workflow: any) => {
    return workflow.createdBy === user?.email;
  };

  // CHANGE: Filter workflows based on user role
  // Creators see all steps, assignees see only their assigned steps
  const getFilteredWorkflows = () => {
    return workflows.map(workflow => {
      const isCreator = isWorkflowCreator(workflow);
      
      if (isCreator) {
        // Creator sees all steps
        return workflow;
      }
      
      // Non-creator sees only their assigned steps
      return {
        ...workflow,
        steps: workflow.steps.filter((step: any) => step.assignee === user?.email)
      };
    }).filter(workflow => workflow.steps.length > 0); // Only show workflows with visible steps
  };

  // CHANGE: Handle step modal open (for assigned users only)
  const handleStepClick = (workflow: any, step: any) => {
    setSelectedStep(step);
    setSelectedStepWorkflow(workflow.id);
  };

  // CHANGE: Handle step modal close
  const handleCloseStepModal = () => {
    setSelectedStep(null);
    setSelectedStepWorkflow(null);
  };

  // CHANGE: Handle step timer actions (start/pause)
  const handleStepUpdate = async (stepId: string, action: 'start' | 'pause') => {
    if (!selectedStepWorkflow) return;
    
    try {
      setIsLoading(true);
      const response = await workflowAPI.updateWorkflowStep(
        selectedStepWorkflow,
        stepId,
        { action }
      );
      
      if (response.success) {
        console.log('✅ Step updated successfully:', response.data);
        
        // Refresh workflows to get updated data
        if (onWorkflowsRefresh) {
          await onWorkflowsRefresh();
        }
        
        // Update the selected step with new data from response
        if (response.data.currentStep) {
          setSelectedStep(response.data.currentStep);
        }
      } else {
        console.error('❌ Failed to update step:', response.message);
        alert(`Failed to ${action} step: ${response.message}`);
      }
    } catch (error) {
      console.error('❌ Error updating step:', error);
      alert(`An error occurred while ${action}ing the step`);
    } finally {
      setIsLoading(false);
    }
  };


// Handle the manual progress update:-
  const handleProgressUpdate = async(progressPercentage: number) => { // REMOVE progressNote parameter
    if (!selectedStep || !selectedStepWorkflow) {
      console.error('No step or workflow selected');
      return;
    }
    
    try {
      const response = await workflowAPI.updateWorkflowStepProgress(
        selectedStepWorkflow,
        selectedStep.id || selectedStep._id,
        {
          progressPercentage
          // REMOVE: progressNote: progressNote || undefined
        }
      );
      
      if (response.success) {
        console.log('✅ Progress updated successfully');
        
        if (onWorkflowsRefresh) {
          await onWorkflowsRefresh();
        }
        
        if (response.data.currentStep) {
          setSelectedStep(response.data.currentStep);
        }
      } else {
        console.error('❌ Failed to update progress:', response.message);
        throw new Error(response.message);
      }
    } catch (error) {
      console.error('❌ Error updating progress:', error);
      throw error;
    }
  };

  // CHANGE: Format time for display (converts seconds to human-readable format)
  const formatTimeDisplay = (seconds: number): string => {
    if (!seconds || seconds === 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
  };
  
  // CHANGE: Get filtered workflows for current user
  const filteredWorkflows = getFilteredWorkflows();

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
        {/* CHANGE: Use filteredWorkflows instead of workflows */}
        {filteredWorkflows.length === 0 ? (
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
          // CHANGE: Map over filteredWorkflows and add isCreator check
          filteredWorkflows.map((workflow) => {
            const isCreator = isWorkflowCreator(workflow);
            
            return (
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
                      onClick={() => {
                        if (isCreator) {
                          // Creator: Toggle expand/collapse
                          setSelectedWorkflow(selectedWorkflow === workflow.id ? null : workflow.id);
                        } else {
                          // Assignee: Open modal directly with their single step
                          if (workflow.steps.length > 0) {
                            handleStepClick(workflow, workflow.steps[0]);
                          }
                        }
                      }}
                    >
                      {isCreator 
                        ? (selectedWorkflow === workflow.id ? 'Hide Details' : 'Show Details')
                        : 'View My Step'
                      }
                    </Button>
                  </div>
                </div>

                {/* Progress Bar */}
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="text-gray-600">
                      {isCreator 
                        ? `${workflow.steps.filter(s => s.status === 'completed').length} / ${workflow.steps.length} steps`
                        : `Step Progress`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${
                          isCreator
                            ? (workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100
                            : (workflow.steps[0]?.progressPercentage || 0)
                        }%`
                      }}
                    />
                  </div>
                  {/* Percentage display below progress bar */}
                  <div className="text-xs text-gray-500 text-right mt-1">
                    {isCreator
                      ? `${Math.round((workflow.steps.filter(s => s.status === 'completed').length / workflow.steps.length) * 100)}%`
                      : `${workflow.steps[0]?.progressPercentage || 0}%`
                    }
                  </div>
                </div>

                {/* CHANGE: Workflow Steps - Different behavior for creator vs assignee */}
                {selectedWorkflow === workflow.id && (
                  <div className="mt-4 space-y-3">
                    {/* CHANGE: Dynamic title based on user role */}
                    <h5 className="text-sm font-medium text-gray-900">
                      {isCreator ? 'All Workflow Steps' : 'Your Assigned Steps'}
                    </h5>
                    {/* CHANGE: Updated step rendering with role-based UI */}
                    {workflow.steps.map((step, index) => {
                      const isAssignedToUser = step.assignee === user?.email;
                      
                      return (
                        <div
                          key={step.id}
                          // CHANGE: Blue background for assigned steps (non-creators only)
                          className={`flex items-center space-x-4 p-3 rounded-lg ${
                            isAssignedToUser && !isCreator ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {/* CHANGE: Color-coded step number based on status */}
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                              step.status === 'completed' 
                                ? 'bg-green-100 border-green-500 text-green-700'
                                : step.status === 'in_progress'
                                ? 'bg-blue-100 border-blue-500 text-blue-700'
                                : step.status === 'rejected'
                                ? 'bg-red-100 border-red-500 text-red-700'
                                : 'bg-white border-gray-200 text-gray-700'
                            }`}>
                              {index + 1}
                            </div>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStepStatusIcon(step.status)}
                              <span className="text-sm font-medium text-gray-900">
                                {step.name}
                              </span>
                              {/* CHANGE: Show "Assigned to you" badge for assignees */}
                              {isAssignedToUser && !isCreator && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  Assigned to you
                                </span>
                              )}
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
                              {/* CHANGE: Show time tracking if available */}
                              {step.timeTracking && step.timeTracking.totalTimeSpent > 0 && (
                                <span>Time: {formatTimeDisplay(step.timeTracking.totalTimeSpent)}</span>
                              )}
                            </div>
                          </div>

                          {/* CHANGE: Step Actions - Different for creator vs assignee */}
                          <div className="flex items-center space-x-2">
                            {isCreator ? (
                              // CHANGE: Creator sees read-only status indicators
                              <>
                                {step.status === 'completed' && (
                                  <span className="text-green-600 text-sm font-medium">✓ Completed</span>
                                )}
                                {step.status === 'rejected' && (
                                  <span className="text-red-600 text-sm font-medium">✗ Rejected</span>
                                )}
                                {step.status === 'in_progress' && (
                                  <span className="text-blue-600 text-sm font-medium">● In Progress</span>
                                )}
                                {step.status === 'pending' && (
                                  <span className="text-gray-600 text-sm font-medium">○ Pending</span>
                                )}
                              </>
                            ) : isAssignedToUser ? (
                              // CHANGE: Assignee can interact via modal
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStepClick(workflow, step)}
                                disabled={step.status === 'completed' || step.status === 'rejected'}
                              >
                                {step.status === 'completed' || step.status === 'rejected' 
                                  ? 'View Details' 
                                  : 'Manage Step'}
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* CHANGE: Add Workflow Step Modal - Only for assigned users */}
      {selectedStep && selectedStepWorkflow && !isWorkflowCreator(
        filteredWorkflows.find(w => w.id === selectedStepWorkflow)!
      ) && (
        <WorkflowStepModal
          step={selectedStep}
          workflowId={selectedStepWorkflow}
          workflowName={filteredWorkflows.find(w => w.id === selectedStepWorkflow)?.name || ''}
          workflowCreatedBy={filteredWorkflows.find(w => w.id === selectedStepWorkflow)?.createdBy || ''}
          workflowDeadline={filteredWorkflows.find(w => w.id === selectedStepWorkflow)?.deadline} // ADD THIS
          onClose={handleCloseStepModal}
          onStepUpdate={handleStepUpdate}
          onStepComplete={handleStepComplete}
          onProgressUpdate={handleProgressUpdate}
          userEmail={user?.email || ''}
        />
      )}

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