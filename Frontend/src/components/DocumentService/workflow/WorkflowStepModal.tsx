import { useState, useEffect, useRef } from 'react';
import { X, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDate } from '../../common/lib/utils';

interface WorkflowStep {
  id: string;
  _id?: string;
  name: string;
  description: string;
  assignee: string;
  assigneeName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  dueDate?: string;
  completedAt?: string;
  comments?: string;
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
  onStepUpdate: (stepId: string, action: 'start' | 'pause') => Promise<void>;
  onStepComplete: (stepId: string, status: 'completed' | 'rejected', comments?: string) => Promise<void>;
  onProgressUpdate: (progressPercentage: number) => Promise<void>;
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
  userEmail
}: WorkflowStepModalProps) {
  const [progressPercentage, setProgressPercentage] = useState(step.progressPercentage || 0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [comments, setComments] = useState(step.comments || '');
  const [isStarting, setIsStarting] = useState(false);
  const [isPausing, setIsPausing] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
  }, [step.timeTracking?.isTimerRunning, step.timeTracking?.lastStartTime, step.timeTracking?.totalTimeSpent]);

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
      return '00:00:00';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStart = async () => {
    try {
      setIsStarting(true);
      await onStepUpdate(step.id || step._id!, 'start');
      startTimerInterval();
    } catch (error) {
      console.error('Failed to start step:', error);
    } finally {
      setIsStarting(false);
    }
  };

  const handlePause = async () => {
    try {
      setIsPausing(true);
      await onStepUpdate(step.id || step._id!, 'pause');
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    } catch (error) {
      console.error('Failed to pause step:', error);
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
      await onStepComplete(step.id || step._id!, 'completed', comments);
      onClose();
    } catch (error) {
      console.error('Failed to complete step:', error);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      alert('Please provide a reason for rejection in the comments field');
      return;
    }
    
    try {
      setIsRejecting(true);
      await onStepComplete(step.id || step._id!, 'rejected', comments);
      onClose();
    } catch (error) {
      console.error('Failed to reject step:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleProgressUpdate = async () => {
    // Simplified validation - only check percentage
    if (progressPercentage === (step.progressPercentage || 0)) {
        alert('Please change the progress percentage');
        return;
    }

    try {
        setIsUpdatingProgress(true);
        await onProgressUpdate(progressPercentage); // REMOVE the second parameter
        alert('Progress updated successfully!');
        onClose();
    } catch (error) {
        console.error('Failed to update progress:', error);
        alert('Failed to update progress');
    } finally {
        setIsUpdatingProgress(false);
    }
  };

  const isAnyActionInProgress = isStarting || isPausing || isCompleting || isRejecting;
  const canModify = step.assignee === userEmail && step.status !== 'completed' && step.status !== 'rejected';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{step.name}</h3>
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
              <h4 className="text-sm font-medium text-gray-900">Step Details</h4>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                step.status === 'completed' ? 'bg-green-100 text-green-800' :
                step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                step.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {step.status.replace('_', ' ').toUpperCase()}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
                {/* Show assignee name prominently */}
                <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Assignee: <strong>{step.assigneeName}</strong></span>
                </div>

                {/* Workflow Creator */}
                <div className="flex items-center space-x-2 text-gray-600">
                    <User className="w-4 h-4 text-purple-600" />
                    <span>Created by: <strong>{workflowCreatedBy}</strong></span>
                </div>
                
                 {/* Workflow Deadline (not step deadline) */}
                    {workflowDeadline ? (
                        <div className="flex items-center space-x-2 text-gray-600">
                        <Calendar className="w-4 h-4 text-red-600" />
                        <span>Workflow Deadline: <strong className="text-red-600">{formatDate(workflowDeadline)}</strong></span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 text-gray-400">
                        <Calendar className="w-4 h-4" />
                        <span>Deadline: <strong>Not set</strong></span>
                        </div>
                    )}

                
                {/* Timer display */}
                <div className="flex items-center space-x-2 text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Time Spent: <strong>{formatTime(currentTime)}</strong></span>
                </div>
                
                {/* Completion date if completed */}
                {step.completedAt && (
                    <div className="flex items-center space-x-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span>Completed: <strong>{formatDate(step.completedAt)}</strong></span>
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
                    value={progressPercentage}
                    onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value >= 0 && value <= 100) {
                        setProgressPercentage(value);
                        }
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isAnyActionInProgress || isUpdatingProgress}
                    />
                    <span className="text-sm text-gray-600">%</span>
                    <Button
                    onClick={handleProgressUpdate}
                    disabled={isAnyActionInProgress || isUpdatingProgress || progressPercentage === (step.progressPercentage || 0)}
                    size="sm"
                    className="ml-2"
                    >
                    {isUpdatingProgress ? 'Updating...' : 'Update Progress'}
                    </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                    Enter a value between 0-100 to track your progress. This won't complete the step.
                </p>
                </div>
            </div>
            )}

          {/* Comments Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Comments {!canModify && step.status === 'rejected' && '(Rejection Reason)'}
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={canModify ? "Add comments (required for rejection)..." : "No comments"}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              disabled={!canModify || isAnyActionInProgress}
            />
            {canModify && (
              <p className="text-xs text-gray-500">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Comments are required when rejecting a step
              </p>
            )}
          </div>

          {/* Read-only message for non-assigned users or completed/rejected steps */}
          {!canModify && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    {step.status === 'completed' || step.status === 'rejected'
                      ? `This step has been ${step.status}.`
                      : 'You can only modify steps assigned to you.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Action Buttons - Only for assigned user */}
        {canModify && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {/* Left side: Start/Pause buttons */}
              <div className="flex space-x-2">
                {!step.timeTracking?.isTimerRunning ? (
                  <Button
                    onClick={handleStart}
                    disabled={isAnyActionInProgress}
                    size="sm"
                    variant="outline"
                    className="bg-white"
                  >
                    {isStarting ? 'Starting...' : 'Start'}
                  </Button>
                ) : (
                  <Button
                    onClick={handlePause}
                    disabled={isAnyActionInProgress}
                    size="sm"
                    variant="outline"
                    className="bg-white"
                  >
                    {isPausing ? 'Pausing...' : 'Pause'}
                  </Button>
                )}
              </div>

              {/* Right side: Complete/Reject buttons */}
              <div className="flex space-x-2">
                <Button
                  onClick={handleComplete}
                  disabled={isAnyActionInProgress}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isCompleting ? 'Completing...' : 'Complete'}
                </Button>
                <Button
                  onClick={handleReject}
                  disabled={isAnyActionInProgress || !comments.trim()}
                  size="sm"
                  variant="outline"
                  className="bg-white text-red-600 border-red-300 hover:bg-red-50"
                >
                  {isRejecting ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}