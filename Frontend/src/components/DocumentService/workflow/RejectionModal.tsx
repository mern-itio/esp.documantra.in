import { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface RejectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, requestRedo: boolean) => void;
  stepName: string;
  isLoading: boolean;
}

export function RejectionModal({
  isOpen,
  onClose,
  onConfirm,
  stepName,
  isLoading,
}: RejectionModalProps) {
  const [reason, setReason] = useState("");
  const [requestRedo, setRequestRedo] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason, requestRedo);
    setReason("");
    setRequestRedo(false);
  };

  const handleClose = () => {
    setReason("");
    setRequestRedo(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-white/30">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Reject Workflow Step
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600">
              <strong>Step:</strong> {stepName}
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label
              htmlFor="rejection-reason"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Reason for Rejection{" "}
              <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              id="rejection-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide feedback or reason for rejection..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
              rows={4}
              disabled={isLoading}
            />
          </div>

          {/* Redo Checkbox */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={requestRedo}
                onChange={(e) => setRequestRedo(e.target.checked)}
                className="mt-1 w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                disabled={isLoading}
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  Request assignee to redo this task
                </p>
                <p className="text-xs text-orange-700 mt-1">
                  {requestRedo ? (
                    <>
                      ✓ The step will be reset to <strong>pending</strong>, and
                      the assignee will be notified to redo the task.
                    </>
                  ) : (
                    <>
                      The step will remain <strong>rejected</strong> without a
                      redo option.
                    </>
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Warning Message */}
          <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <p className="text-sm text-red-800">
              <strong>Warning:</strong> This action cannot be undone. The
              assignee will be notified via email.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Rejecting...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>Reject Step</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}