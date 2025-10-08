import { useState, useEffect, useRef } from "react";
import {
  X,
  Clock,
  User,
  Calendar,
  AlertCircle,
  Send,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { formatDate } from "../../common/lib/utils";

interface WorkflowStep {
  id: string;
  _id?: string;
  name: string;
  description: string;
  assignee: string;
  assigneeName: string;
  status: "pending" | "in_progress" | "completed" | "rejected";
  dueDate?: string;
  completedAt?: string;
  comments?: string[];
  progressPercentage?: number;
  timeTracking?: {
    totalTimeSpent: number;
    isTimerRunning: boolean;
    lastStartTime?: string;
    sessions: Array<{
      startedAt: string;
      pausedAt: string;
      duration: number;
    }>;
  };
}

interface WorkflowStepModalProps {
  step: WorkflowStep;
  workflowId: string;
  workflowName: string;
  workflowCreatedBy: string;
  workflowDeadline?: string;
  onClose: () => void;
  onStepUpdate: (stepId: string, action: "start" | "pause") => Promise<void>;
  onStepComplete: (
    stepId: string,
    status: "completed" | "rejected",
    comments?: string
  ) => Promise<void>;
  onProgressUpdate: (progressPercentage: number) => Promise<void>;
  onCommentAdd: (stepId: string, comment: string) => Promise<void>;
  userEmail: string;
}

export function WorkflowStepModal({
  step,
  workflowCreatedBy,
  workflowDeadline,
  workflowName,
  onClose,
  onStepUpdate,
  onStepComplete,
  onProgressUpdate,
  onCommentAdd,
  userEmail,
}: WorkflowStepModalProps) {
  const [progressPercentage, setProgressPercentage] = useState<number | "">(
    step.progressPercentage && step.progressPercentage > 0
      ? step.progressPercentage
      : ""
  );
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [completionComment, _setCompletionComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState("");
  const [customRejectionReason, setCustomRejectionReason] = useState("");
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const rejectionReasons = [
    "Requirements not met",
    "Quality standards not achieved",
    "Missing critical information",
    "Deadline cannot be met",
    "Technical constraints encountered",
    "Other (specify below)",
  ];

  // Calculate initial time
  useEffect(() => {
    calculateCurrentTime();

    // Start interval if timer is running
    if (step.timeTracking?.isTimerRunning) {
      startTimerInterval();
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [
    step.timeTracking?.isTimerRunning,
    step.timeTracking?.lastStartTime,
    step.timeTracking?.totalTimeSpent,
  ]);

  const calculateCurrentTime = () => {
    let total = step.timeTracking?.totalTimeSpent || 0;

    if (step.timeTracking?.isTimerRunning && step.timeTracking?.lastStartTime) {
      const startTime = new Date(step.timeTracking.lastStartTime).getTime();
      const now = Date.now();
      const sessionTime = Math.floor((now - startTime) / 1000);
      total += sessionTime;
    }

    setCurrentTime(total);
  };
  const startTimerInterval = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      calculateCurrentTime();
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || seconds === 0) {
      return "00:00:00";
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  const handleStart = async () => {
    try {
      setIsStarting(true);
      await onStepUpdate(step.id || step._id!, "start");
      startTimerInterval();
    } catch (error) {
      console.error("Failed to start step:", error);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsPausing(true);
      await onStepUpdate(step.id || step._id!, "pause");
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    } catch (error) {
      console.error("Failed to pause step:", error);
    } finally {
      setIsPausing(false);
    }
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      // Set progress to 100% before completing
      if (progressPercentage !== 100) {
        await onProgressUpdate(100);
      }
      // Pass completion comment if provided
      await onStepComplete(
        step.id || step._id!,
        "completed",
        completionComment.trim() || undefined
      );
      onClose();
    } catch (error) {
      console.error("Failed to complete step:", error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleRejectClick = () => {
    setShowRejectionModal(true);
    setSelectedRejectionReason("");
    setCustomRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    const finalReason =
      selectedRejectionReason === "Other (specify below)"
        ? customRejectionReason.trim()
        : selectedRejectionReason;

    if (!finalReason) {
      alert("Please select or enter a reason for rejection");
      return;
    }

    try {
      setIsRejecting(true);
      await onStepComplete(step.id || step._id!, "rejected", finalReason);
      setShowRejectionModal(false);
      onClose();
    } catch (error) {
      console.error("Failed to reject step:", error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleProgressUpdate = async () => {
    // Check if input is empty or same as current
    if (
      progressPercentage === "" ||
      progressPercentage === (step.progressPercentage || 0)
    ) {
      alert("Please enter a valid progress percentage");
      return;
    }

    try {
      setIsUpdatingProgress(true);
      await onProgressUpdate(progressPercentage);
      alert("Progress updated successfully!");
      //onClose();
    } catch (error) {
      console.error("Failed to update progress:", error);
      alert("Failed to update progress");
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    try {
      setIsAddingComment(true);
      await onCommentAdd(step.id || step._id!, newComment.trim());
      setNewComment("");
      alert("Comment added successfully!");
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment");
    } finally {
      setIsAddingComment(false);
    }
  };
  const isAnyActionInProgress =
    isStarting || isPausing || isCompleting || isRejecting || isAddingComment;
  const canModify =
    step.assignee === userEmail &&
    step.status !== "completed" &&
    step.status !== "rejected";

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {step.name}
              </h3>
              <p className="text-sm text-gray-500">{workflowName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Step Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900">
                  Step Details
                </h4>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    step.status === "completed"
                      ? "bg-green-100 text-green-800"
                      : step.status === "in_progress"
                      ? "bg-blue-100 text-blue-800"
                      : step.status === "rejected"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {step.status.replace("_", " ").toUpperCase()}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Show assignee name prominently */}
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>
                    Assignee: <strong>{step.assigneeName}</strong>
                  </span>
                </div>

                {/* Workflow Creator */}
                <div className="flex items-center space-x-2 text-gray-600">
                  <User className="w-4 h-4 text-purple-600" />
                  <span>
                    Created by: <strong>{workflowCreatedBy}</strong>
                  </span>
                </div>

                {/* Workflow Deadline (not step deadline) */}
                {workflowDeadline && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <span>
                      Workflow Deadline:{" "}
                      <strong className="text-red-600">
                        {formatDate(workflowDeadline)}
                      </strong>
                    </span>
                  </div>
                )}

                {/* Timer display with play/pause button */}
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>
                    Time Spent: <strong>{formatTime(currentTime)}</strong>
                  </span>
                  {canModify &&
                    (!step.timeTracking?.isTimerRunning ? (
                      <button
                        onClick={handleStart}
                        disabled={isAnyActionInProgress}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        title="Start Timer"
                      >
                        <svg
                          className="w-5 h-5 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    ) : (
                      <button
                        onClick={handlePause}
                        disabled={isAnyActionInProgress}
                        className="p-1.5 hover:bg-gray-200 rounded transition-colors disabled:opacity-50"
                        title="Pause Timer"
                      >
                        <svg
                          className="w-5 h-5 text-orange-600"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      </button>
                    ))}
                </div>

                {/* Completion date if completed */}
                {step.completedAt && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span>
                      Completed: <strong>{formatDate(step.completedAt)}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">{step.description}</p>
              </div>
            </div>
            {/* Progress Update Section - Only for assigned user */}
            {canModify && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Progress Percentage
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={
                        progressPercentage === "" ? "" : progressPercentage
                      }
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setProgressPercentage("");
                        } else {
                          const numValue = Number(value);
                          if (numValue >= 0 && numValue <= 100) {
                            setProgressPercentage(numValue);
                          }
                        }
                      }}
                      onFocus={(e) => {
                        // Only clear if there's no previous progress (0 or empty)
                        if (
                          !step.progressPercentage ||
                          step.progressPercentage === 0
                        ) {
                          setProgressPercentage("");
                          e.target.value = "";
                        }
                        // If there's existing progress, keep it for editing
                      }}
                      placeholder={
                        step.progressPercentage ? undefined : "Enter progress %"
                      }
                      className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isAnyActionInProgress || isUpdatingProgress}
                    />
                    <span className="text-sm text-gray-600">%</span>
                    <Button
                      onClick={handleProgressUpdate}
                      disabled={isUpdatingProgress}
                      size="sm"
                      className="ml-2"
                    >
                      {isUpdatingProgress ? "Updating..." : "Update Progress"}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a value between 0-100 to track your progress. This
                    won't complete the step.
                  </p>
                </div>
              </div>
            )}

            {/* Add Comment Section - Only for assigned user */}
            {canModify && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Add Comment
                </label>
                <div className="flex flex-col space-y-2">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment to track your progress..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    disabled={isAnyActionInProgress}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      <AlertCircle className="w-3 h-3 inline mr-1" />
                      Track your progress and communicate updates
                    </p>
                    <Button
                      onClick={handleAddComment}
                      disabled={isAnyActionInProgress}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isAddingComment ? (
                        "Adding..."
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Add Comment
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Comments History Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  <label className="block text-sm font-medium text-gray-700">
                    Comments History
                  </label>
                </div>
                {step.comments && step.comments.length > 0 && (
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {step.comments.length}
                  </span>
                )}
              </div>

              {step.comments && step.comments.length > 0 ? (
                <div className="max-h-64 overflow-y-auto space-y-3 bg-gradient-to-b from-gray-50 to-white rounded-lg p-4 border border-gray-200">
                  {step.comments.map((comment, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
                          <span className="text-xs font-semibold text-white">
                            {idx + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 leading-relaxed">
                            {comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-6 text-center border border-gray-200">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <MessageSquare className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-600">
                    No comments yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Comments will appear here as progress updates
                  </p>
                </div>
              )}
            </div>

            {/* Read-only message for non-assigned users or completed/rejected steps */}
            {!canModify && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400 flex-shrink-0" />
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      {step.status === "completed" || step.status === "rejected"
                        ? `This step has been ${step.status}.`
                        : "You can only modify steps assigned to you."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer with Action Buttons - Only for assigned user */}
          {canModify && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-end space-x-2">
                <Button
                  onClick={handleComplete}
                  disabled={isAnyActionInProgress}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isCompleting ? "Completing..." : "Complete Step"}
                </Button>
                <Button
                  onClick={handleRejectClick}
                  disabled={isAnyActionInProgress}
                  size="sm"
                  variant="outline"
                  className="bg-white text-red-600 border-red-300 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Step
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rejection Reason Modal */}
      {showRejectionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Reason for Rejection
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Please select or specify why you're rejecting this step
              </p>
            </div>

            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
              {rejectionReasons.map((reason, index) => (
                <label
                  key={index}
                  className={`flex items-start p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedRejectionReason === reason
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={selectedRejectionReason === reason}
                    onChange={(e) => setSelectedRejectionReason(e.target.value)}
                    className="mt-0.5 mr-3 text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-700 font-medium">
                    {reason}
                  </span>
                </label>
              ))}

              {selectedRejectionReason === "Other (specify below)" && (
                <div className="mt-3">
                  <textarea
                    value={customRejectionReason}
                    onChange={(e) => setCustomRejectionReason(e.target.value)}
                    placeholder="Please specify the reason for rejection..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-2">
              <Button
                onClick={() => setShowRejectionModal(false)}
                variant="outline"
                size="sm"
                disabled={isRejecting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                disabled={
                  isRejecting ||
                  !selectedRejectionReason ||
                  (selectedRejectionReason === "Other (specify below)" &&
                    !customRejectionReason.trim())
                }
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {isRejecting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}