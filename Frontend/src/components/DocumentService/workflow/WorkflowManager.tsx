import { useState } from "react";
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
  MessageSquare,
  X,
} from "lucide-react";
import { Button } from "../ui/button";
import { WorkflowDesigner } from "./WorkflowDesigner";
import type { DocumentWorkflow } from "../../common/types/collaboration";
import { formatDate } from "../../common/lib/utils";
import { workflowAPI } from "../../../services/api";
import { useAuth } from "../../AuthService/AuthContext";
import { WorkflowStepModal } from "./WorkflowStepModal";

interface WorkflowManagerProps {
  documentId: string;
  workflows: DocumentWorkflow[];
  onWorkflowUpdate: (
    workflowId: string,
    updates: Partial<DocumentWorkflow>
  ) => void;
  onStepComplete: (workflowId: string, stepId: string) => void;
  onWorkflowsRefresh: () => void;
}

export function WorkflowManager({
  documentId,
  workflows,
  onStepComplete: _onStepComplete,
  onWorkflowsRefresh,
}: WorkflowManagerProps) {
  const [showDesigner, setShowDesigner] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [selectedStep, setSelectedStep] = useState<any | null>(null);
  const [selectedStepWorkflow, setSelectedStepWorkflow] = useState<
    string | null
  >(null);


  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="w-4 h-4 text-blue-600" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "cancelled":
        return <Pause className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStepStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-600" />;
      case "rejected":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleWorkflowCreate = async (
    workflow: Omit<DocumentWorkflow, "id" | "createdAt">
  ): Promise<void> => {
    try {
      if (isLoading) {
        console.log("⚠️ Workflow creation already in progress, skipping...");
        return;
      }

      setIsLoading(true);
      const response = await workflowAPI.createWorkflow(documentId, workflow);

      if (response.success) {
        console.log("✅ Workflow created successfully:", response.data);
        if (onWorkflowsRefresh) {
          onWorkflowsRefresh();
        }
        setShowDesigner(false);
        alert("Workflow created successfully!");
      } else {
        console.error("❌ Failed to create workflow:", response.message);
        alert(`Failed to create workflow: ${response.message}`);
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("❌ Error creating workflow:", error);
      alert("An error occurred while creating the workflow");
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleStepComplete = async (
    stepId: string,
    status: string,
    comments?: string
  ) => {
    if (!selectedStepWorkflow) {
      console.error("No workflow selected");
      return;
    }

    try {
      setIsLoading(true);
      const response = await workflowAPI.completeWorkflowStep(
        selectedStepWorkflow,
        stepId,
        {
          status: status as
            | "pending"
            | "in_progress"
            | "completed"
            | "rejected",
          comments,
        }
      );

      if (response.success) {
        console.log("✅ Workflow step completed successfully:", response.data);

        if (status === "completed") {
          alert("Workflow step completed successfully!");
        } else if (status === "rejected") {
          alert("Workflow step rejected successfully!");
        }

        if (onWorkflowsRefresh) {
          await onWorkflowsRefresh();
        }

        handleCloseStepModal();
      } else {
        console.error("❌ Failed to complete workflow step:", response.message);
        alert(`Failed to complete step: ${response.message}`);
      }
    } catch (error) {
      console.error("❌ Error completing workflow step:", error);
      alert("An error occurred while completing the step");
    } finally {
      setIsLoading(false);
    }
  };

  const isWorkflowCreator = (workflow: any) => {
    return workflow.createdBy === user?.email;
  };

  const getFilteredWorkflows = () => {
    return workflows
      .map((workflow) => {
        const isCreator = isWorkflowCreator(workflow);

        if (isCreator) {
          return workflow;
        }

        return {
          ...workflow,
          steps: workflow.steps.filter(
            (step: any) => step.assignee === user?.email
          ),
        };
      })
      .filter((workflow) => workflow.steps.length > 0);
  };

  const handleStepClick = (workflow: any, step: any) => {
    setSelectedStep(step);
    setSelectedStepWorkflow(workflow.id);
  };

  const handleCloseStepModal = () => {
    setSelectedStep(null);
    setSelectedStepWorkflow(null);
  };

  const handleStepUpdate = async (
    stepId: string,
    action: "start" | "pause"
  ) => {
    if (!selectedStepWorkflow) return;

    try {
      setIsLoading(true);
      const response = await workflowAPI.updateWorkflowStep(
        selectedStepWorkflow,
        stepId,
        { action }
      );

      if (response.success) {
        console.log("✅ Step updated successfully:", response.data);

        if (onWorkflowsRefresh) {
          await onWorkflowsRefresh();
        }

        if (response.data.currentStep) {
          setSelectedStep(response.data.currentStep);
        }
      } else {
        console.error("❌ Failed to update step:", response.message);
        alert(`Failed to ${action} step: ${response.message}`);
      }
    } catch (error) {
      console.error("❌ Error updating step:", error);
      alert(`An error occurred while ${action}ing the step`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (progressPercentage: number) => {
    if (!selectedStep || !selectedStepWorkflow) {
      console.error("No step or workflow selected");
      return;
    }

    try {
      const response = await workflowAPI.updateWorkflowStepProgress(
        selectedStepWorkflow,
        selectedStep.id || selectedStep._id,
        {
          progressPercentage,
        }
      );

      if (response.success) {
        console.log("✅ Progress updated successfully");

        if (onWorkflowsRefresh) {
          await onWorkflowsRefresh();
        }

        if (response.data.currentStep) {
          setSelectedStep(response.data.currentStep);
        }
      } else {
        console.error("❌ Failed to update progress:", response.message);
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("❌ Error updating progress:", error);
      throw error;
    }
  };

  const handleCommentAdd = async (stepId: string, comment: string) => {
    if (!selectedStepWorkflow) {
      console.error("No workflow selected");
      return;
    }

    try {
      const response = await workflowAPI.addWorkflowStepComment(
        selectedStepWorkflow,
        stepId,
        { comment }
      );

      if (response.success) {
        console.log("✅ Comment added successfully");

        if (onWorkflowsRefresh) {
          await onWorkflowsRefresh();
        }

        if (response.data.currentStep) {
          setSelectedStep(response.data.currentStep);
        }
      } else {
        console.error("❌ Failed to add comment:", response.message);
        throw new Error(response.message);
      }
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      throw error;
    }
  };

  const handleDirectAction = async (
  type: 'approved' | 'rejected' | 'dropped',
  workflowId: string,
  stepId: string
) => {
  // Log IDs for debugging
  console.log('🔹 handleDirectAction called');
  console.log('Workflow ID:', workflowId);
  console.log('Step ID:', stepId);
  console.log('Action type:', type);

  const actionText = type === 'approved' ? 'approve' : 
                    type === 'rejected' ? 'reject' : 'drop';
  
  const confirmMessage = `Are you sure you want to ${actionText} this step?`;
  
  if (!window.confirm(confirmMessage)) {
    return;
  }

  try {
    setIsLoading(true);
    const response = await workflowAPI.updateStepActionStatus(
      workflowId,
      stepId,
      {
        actionStatus: type,
        comments: undefined, // No comments
      }
    );

    if (response.success) {
      console.log("✅ Action status updated successfully:", response.data);
      
      alert(`Step ${actionText}ed successfully!`);

      if (onWorkflowsRefresh) {
        await onWorkflowsRefresh();
      }
    } else {
      console.error("❌ Failed to update action status:", response.message);
      alert(`Failed to ${actionText} step: ${response.message}`);
    }
  } catch (error) {
    console.error("❌ Error updating action status:", error);
    alert(`An error occurred while ${actionText}ing the step`);
  } finally {
    setIsLoading(false);
  }
};

  const formatTimeDisplay = (seconds: number): string => {
    if (!seconds || seconds === 0) return "0s";

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(" ");
  };

  // Helper function to parse comment string
  const parseComment = (comment: string) => {
    // Parse the comment string format: "userName [time, date] : comment"
    const match = comment.match(/^(.+?)\s*\[(.+?),\s*(.+?)\]\s*:\s*(.+)$/);
    
    if (match) {
      const [, userName, time, date, commentText] = match;
      return {
        userName: userName.trim(),
        time: time.trim(),
        date: date.trim(),
        commentText: commentText.trim(),
        isParsed: true
      };
    }
    
    return {
      userName: "",
      time: "",
      date: "",
      commentText: comment,
      isParsed: false
    };
  };

  // Helper function to render comment item
  const renderCommentItem = (comment: string, idx: number) => {
    const parsed = parseComment(comment);
    
    if (parsed.isParsed) {
      return (
        <div
          key={idx}
          className="bg-white p-3 rounded border border-gray-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-900">
                  {parsed.userName}
                </span>
              </div>
              <p className="text-sm text-gray-600 break-words">
                {parsed.commentText}
              </p>
            </div>
            <div className="flex flex-col items-end text-xs text-gray-500 whitespace-nowrap">
              <span>{parsed.date}</span>
              <span>{parsed.time}</span>
            </div>
          </div>
        </div>
      );
    }
    
    // Fallback for comments that don't match the expected format
    return (
      <div
        key={idx}
        className="bg-white p-2 rounded border border-gray-200"
      >
        <p className="text-sm text-gray-600">
          {comment}
        </p>
      </div>
    );
  };

  const getActionStatusBadge = (actionStatus: string | null) => {
    if (!actionStatus) return null;

    const statusConfig = {
      approved: {
        bg: "bg-green-100",
        text: "text-green-800",
        border: "border-green-300",
        label: "Approved"
      },
      rejected: {
        bg: "bg-red-100",
        text: "text-red-800",
        border: "border-red-300",
        label: "Rejected"
      },
      dropped: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-300",
        label: "Dropped"
      }
    };

    const config = statusConfig[actionStatus as keyof typeof statusConfig];
    if (!config) return null;

    return (
      <div className={`px-3 py-2 rounded-lg border-2 ${config.border} ${config.bg} mb-3`}>
        <p className={`text-sm font-semibold ${config.text}`}>
          ⚠️ This step has been {config.label.toLowerCase()} by the workflow creator
        </p>
      </div>
    );
  };

  const filteredWorkflows = getFilteredWorkflows();

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Workflow className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Document Workflows
            </h3>
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
        {filteredWorkflows.length === 0 ? (
          <div className="p-8 text-center">
            <Workflow className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workflows yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first workflow to automate document processes
            </p>
            <Button onClick={() => setShowDesigner(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Workflow
            </Button>
          </div>
        ) : (
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
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(
                          workflow.priority
                        )}`}
                      >
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
                        setSelectedWorkflow(
                          selectedWorkflow === workflow.id
                            ? null
                            : workflow.id
                        );
                      }}
                    >
                      {selectedWorkflow === workflow.id
                        ? isCreator ? "Hide Details" : "Hide Steps"
                        : isCreator ? "Show Details" : "View My Steps"}
                    </Button>
                  </div>
                </div>

                {/* Workflow Steps - Show all steps for creators, all assigned steps for users (when expanded) */}
                {selectedWorkflow === workflow.id && (
                  <div className="mt-4 space-y-3">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                      {isCreator ? "All Workflow Steps" : "Your Assigned Steps"}
                    </h5>
                    {workflow.steps.map((step, index) => {
                      const isAssignedToUser = step.assignee === user?.email;

                      return (
                        <div
                          key={step.id}
                          className={`rounded-lg p-4 border-l-4 ${
                            step.status === "completed"
                              ? "bg-green-50 border-green-600"
                              : step.status === "in_progress"
                              ? "bg-yellow-50 border-yellow-600"
                              : step.status === "rejected"
                              ? "bg-red-50 border-red-600"
                              : "bg-gray-50 border-gray-300"
                          }`}
                        >
                          <div className="space-y-3">
                            {/* Action Status Badge */}
                            {step.actionStatus && getActionStatusBadge(step.actionStatus)}

                            {/* Step Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                                    step.status === "completed"
                                      ? "bg-green-100 border-green-500 text-green-700"
                                      : step.status === "in_progress"
                                      ? "bg-yellow-100 border-yellow-500 text-yellow-700"
                                      : step.status === "rejected"
                                      ? "bg-red-100 border-red-500 text-red-700"
                                      : "bg-white border-gray-300 text-gray-700"
                                  }`}
                                >
                                  {index + 1}
                                </div>
                                {getStepStatusIcon(step.status)}
                                <span className="text-sm font-medium text-gray-900">
                                  {step.name}
                                </span>
                                {isAssignedToUser && !isCreator && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                    Assigned to you
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-1 text-xs rounded-full ${
                                    step.status === "completed"
                                      ? "bg-green-100 text-green-800"
                                      : step.status === "in_progress"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : step.status === "rejected"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {step.status === "completed"
                                    ? "Completed"
                                    : step.status === "in_progress"
                                    ? "In Progress"
                                    : step.status === "rejected"
                                    ? "Rejected"
                                    : "Pending"}
                                </span>
                              </div>
                            </div>

                            {/* Step Description */}
                            <p className="text-sm text-gray-600">
                              {step.description}
                            </p>

                            {/* Progress Bar for Each Step */}
                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600">
                                  Step Progress
                                </span>
                                <span className="text-gray-600">
                                  {step.progressPercentage || 0}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    step.status === "completed"
                                      ? "bg-green-600"
                                      : step.status === "in_progress"
                                      ? "bg-yellow-600"
                                      : step.status === "rejected"
                                      ? "bg-red-600"
                                      : "bg-gray-400"
                                  }`}
                                  style={{
                                    width: `${step.progressPercentage || 0}%`,
                                  }}
                                />
                              </div>
                            </div>

                            {/* Step Details Grid */}
                            <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-gray-200">
                              <div className="flex items-center space-x-2 text-gray-600">
                                <User className="w-4 h-4" />
                                <span>
                                  Assignee: <strong>{step.assigneeName}</strong>
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 text-gray-600">
                                <User className="w-4 h-4 text-purple-600" />
                                <span>
                                  Created by:{" "}
                                  <strong>{workflow.createdBy}</strong>
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 text-gray-600">
                                <Calendar className="w-4 h-4 text-blue-600" />
                                <span>
                                  Workflow Created:{" "}
                                  <strong>
                                    {formatDate(workflow.createdAt)}
                                  </strong>
                                </span>
                              </div>

                              {workflow.deadline && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Calendar className="w-4 h-4 text-red-600" />
                                  <span>
                                    Workflow Deadline:{" "}
                                    <strong className="text-red-600">
                                      {formatDate(workflow.deadline)}
                                    </strong>
                                  </span>
                                </div>
                              )}

                              {step.dueDate && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Calendar className="w-4 h-4 text-orange-600" />
                                  <span>
                                    Step Due:{" "}
                                    <strong>{formatDate(step.dueDate)}</strong>
                                  </span>
                                </div>
                              )}

                              {step.timeTracking &&
                                step.timeTracking.totalTimeSpent > 0 && (
                                  <div className="flex items-center space-x-2 text-gray-600">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                      Time Spent:{" "}
                                      <strong>
                                        {formatTimeDisplay(
                                          step.timeTracking.totalTimeSpent
                                        )}
                                      </strong>
                                    </span>
                                  </div>
                                )}

                              {step.completedAt && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <Calendar className="w-4 h-4 text-green-600" />
                                  <span>
                                    Step Completed:{" "}
                                    <strong>
                                      {formatDate(step.completedAt)}
                                    </strong>
                                  </span>
                                </div>
                              )}

                              {step.progressPercentage !== undefined && (
                                <div className="flex items-center space-x-2 text-gray-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>
                                    Progress:{" "}
                                    <strong>{step.progressPercentage}%</strong>
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Comments Section - Both Admin and User View */}
                            {step.comments && step.comments.length > 0 && (
                              <div className="pt-3 border-t border-gray-200">
                                <div className="flex items-start space-x-2">
                                  <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5" />
                                  <div className="flex-1">
                                    <span className="text-xs font-medium text-gray-700 mb-2 block">
                                      Comments History:
                                    </span>
                                    <div className="space-y-2">
                                      {step.comments.map((comment, idx) => 
                                        renderCommentItem(comment, idx)
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-2 pt-3 border-t border-gray-200">
                              {isCreator ? (
                                <>
                                  {step.status === "completed" && !step.actionStatus && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleDirectAction('approved', workflow.id, step.id)}
                                        disabled={isLoading}
                                      >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-red-600 text-red-600 hover:bg-red-50"
                                        onClick={() => handleDirectAction('rejected', workflow.id, step.id)}
                                        disabled={isLoading}
                                      >
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </>
                                  )}
                                  {step.status === "in_progress" && !step.actionStatus && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="border-red-600 text-red-600 hover:bg-red-50"
                                      onClick={() => handleDirectAction('dropped', workflow.id, step.id)}
                                      disabled={isLoading}
                                    >
                                      <AlertTriangle className="w-4 h-4 mr-2" />
                                      Drop Step
                                    </Button>
                                  )}
                                  {step.status === "pending" && (
                                    <span className="text-sm text-gray-500 italic">
                                      Waiting for assignee to start...
                                    </span>
                                  )}
                                  {step.actionStatus === "approved" && (
                                    <span className="text-sm text-green-600 font-medium">
                                      ✓ This step has been approved
                                    </span>
                                  )}
                                  {step.actionStatus === "rejected" && (
                                    <span className="text-sm text-red-600 font-medium">
                                      ✗ This step has been rejected
                                    </span>
                                  )}
                                  {step.actionStatus === "dropped" && (
                                    <span className="text-sm text-gray-600 font-medium">
                                      ⊗ This step has been dropped
                                    </span>
                                  )}
                                </>
                              ) : (
                                <>
                                  {isAssignedToUser && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        handleStepClick(workflow, step)
                                      }
                                      disabled={
                                        step.status === "completed" ||
                                        step.status === "rejected" ||
                                        !!step.actionStatus
                                      }
                                    >
                                      {step.actionStatus || step.status === "completed" ||
                                      step.status === "rejected"
                                        ? "View Details"
                                        : "Manage Step"}
                                    </Button>
                                  )}
                                </>
                              )}
                            </div>
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


      {/* Workflow Step Modal */}
      {selectedStep &&
        selectedStepWorkflow &&
        !isWorkflowCreator(
          filteredWorkflows.find((w) => w.id === selectedStepWorkflow)!
        ) && (
          <WorkflowStepModal
            step={selectedStep}
            workflowId={selectedStepWorkflow}
            workflowName={
              filteredWorkflows.find((w) => w.id === selectedStepWorkflow)
                ?.name || ""
            }
            workflowCreatedBy={
              filteredWorkflows.find((w) => w.id === selectedStepWorkflow)
                ?.createdBy || ""
            }
            workflowDeadline={
              filteredWorkflows.find((w) => w.id === selectedStepWorkflow)
                ?.deadline
            }
            onClose={handleCloseStepModal}
            onStepUpdate={handleStepUpdate}
            onStepComplete={handleStepComplete}
            onProgressUpdate={handleProgressUpdate}
            onCommentAdd={handleCommentAdd}
            userEmail={user?.email || ""}
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