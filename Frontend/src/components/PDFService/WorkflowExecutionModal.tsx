import React, { useState, useEffect } from 'react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2, 
  Download,
  ArrowRight,
  Edit3,
} from 'lucide-react';
import { workflowExecutionAPI } from '../../services/workflowService';
import type { WorkflowTemplate, WorkflowStep } from '../../services/workflowService';

interface WorkflowExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: WorkflowTemplate | null;
}

type ExecutionStep = 'select' | 'upload' | 'processing' | 'completed';

export const WorkflowExecutionModal: React.FC<WorkflowExecutionModalProps> = ({
  isOpen,
  onClose,
  workflow
}) => {
  const [currentStep, setCurrentStep] = useState<ExecutionStep>('select');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [customFilename, setCustomFilename] = useState<string>('');
  const [stepProgress, setStepProgress] = useState<Array<{id: string, name: string, status: 'pending' | 'running' | 'completed' | 'failed', toolId: string}>>([]);

  // Determine the correct file extension based on the workflow steps
  const getOutputExtension = (workflow: WorkflowTemplate | null) => {
    if (!workflow || !workflow.steps || workflow.steps.length === 0) {
      return 'pdf'; // Default fallback
    }
    
    // Get the last step (final output format)
    const lastStep = workflow.steps[workflow.steps.length - 1];
    
    switch (lastStep.toolId) {
      case 'pdf-to-word':
      case 'excel-to-doc':
      case 'doc-to-excel':
        return 'docx';
      case 'pdf-to-excel':
      case 'excel-to-pdf':
        return 'xlsx';
      case 'pdf-to-ppt':
      case 'ppt-to-pdf':
        return 'pptx';
      case 'pdf-to-text':
      case 'text-to-pdf':
        return 'txt';
      case 'pdf-to-html':
        return 'html';
      case 'pdf-to-image':
        return 'png';
      case 'pdf-to-epub':
        return 'epub';
      default:
        return 'pdf';
    }
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep('select');
      setSelectedFile(null);
      setExecutionId(null);
      setProcessingStatus('');
      setError(null);
      setLoading(false);
      setIsEditingFilename(false);
      setCustomFilename('');
      setStepProgress([]);
    }
  }, [isOpen]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCurrentStep('upload');
    // Initialize custom filename with the original filename (without extension)
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    setCustomFilename(`${baseName}_processed`);
  };

  const handleStartProcessing = async () => {
    if (!workflow || !selectedFile) return;

    try {
      setLoading(true);
      setError(null);
      setCurrentStep('processing');
      
      // Initialize step progress
      const initialStepProgress = workflow.steps.map(step => ({
        id: step.id,
        name: step.name,
        status: 'pending' as const,
        toolId: step.toolId
      }));
      setStepProgress(initialStepProgress);

      const response = await workflowExecutionAPI.executeWorkflow(workflow._id, selectedFile, {
        customName: customFilename || workflow.name,
        customDescription: workflow.description,
        steps: workflow.steps
      });

      if (response.success) {
        setExecutionId(response.data.executionId);
        // Start polling for status updates
        pollExecutionStatus(response.data.executionId);
      } else {
        setError('Failed to start workflow execution');
        setCurrentStep('upload');
      }
    } catch (err) {
      console.error('Error starting workflow:', err);
      setError('Failed to start workflow execution');
      setCurrentStep('upload');
    } finally {
      setLoading(false);
    }
  };

  const pollExecutionStatus = async (execId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await workflowExecutionAPI.getWorkflowExecution(execId);
        if (response.success) {
          const execution = response.data;
          setProcessingStatus(execution.status);

          // Update step progress based on execution steps
          if (execution.steps && Array.isArray(execution.steps)) {
            const updatedStepProgress = execution.steps.map((execStep: any) => ({
              id: execStep.stepId || execStep.id,
              name: execStep.name,
              status: execStep.status || 'pending',
              toolId: execStep.toolId
            }));
            setStepProgress(updatedStepProgress);
          }

          if (execution.status === 'completed') {
            clearInterval(pollInterval);
            setCurrentStep('completed');
          } else if (execution.status === 'failed') {
            clearInterval(pollInterval);
            setError('Workflow execution failed');
            setCurrentStep('upload');
          }
        }
      } catch (err) {
        console.error('Error polling execution status:', err);
        clearInterval(pollInterval);
        setError('Failed to check execution status');
        setCurrentStep('upload');
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup interval after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  };

  const handleDownload = async () => {
    if (!executionId) {
      setError('No execution ID available for download');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Download the file using the workflow service
      const blob = await workflowExecutionAPI.downloadWorkflowResult(executionId);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const outputExtension = getOutputExtension(workflow);
      link.download = `${customFilename || selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'document'}_processed.${outputExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the object URL
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step: WorkflowStep, _index: number) => {
    // Find the step progress for this step
    const stepProgressItem = stepProgress.find(sp => sp.id === step.id);
    const status = stepProgressItem?.status || 'pending';
    
    if (status === 'completed') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    } else if (status === 'running') {
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    } else if (status === 'failed') {
      return <X className="w-4 h-4 text-red-500" />;
    } else {
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  if (!isOpen || !workflow) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{workflow.name}</h2>
              <p className="text-sm text-gray-600">{workflow.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={currentStep === 'processing'}
            className={`p-2 rounded-lg transition-colors ${
              currentStep === 'processing' 
                ? 'opacity-50' 
                : 'hover:bg-gray-100'
            }`}
            style={{
              cursor: currentStep === 'processing' ? 'not-allowed' : 'pointer'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Workflow Selection */}
          {currentStep === 'select' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow Steps</h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
                  {workflow.steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center space-x-1">
                        {getStepIcon(step, index)}
                        <span>{step.name}</span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Ready to Process</h4>
                <p className="text-gray-600 mb-4">This workflow will process your files through the following steps:</p>
                <ul className="text-left text-sm text-gray-600 space-y-1">
                  {workflow.steps.map((step, index) => (
                    <li key={step.id} className="flex items-center space-x-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span>{step.name}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setCurrentStep('upload')}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <span>Launch Workflow</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: File Upload */}
          {currentStep === 'upload' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your File</h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                  {workflow.steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center space-x-1">
                        {getStepIcon(step, index)}
                        <span>{step.name}</span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                {selectedFile ? (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-8 h-8 text-blue-600" />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900">{selectedFile.name}</p>
                        <p className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:border-gray-400 transition-colors"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = '.pdf,.doc,.docx,.xlsx,.pptx,.txt,.html';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) handleFileSelect(file);
                      };
                      input.click();
                    }}
                  >
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload a file</p>
                    <p className="text-sm text-gray-500">Upload files upto 2MB</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCurrentStep('select')}
                  disabled={loading}
                  className={`px-4 py-2 transition-colors ${
                    loading 
                      ? 'text-gray-400' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  style={{
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleStartProcessing}
                  disabled={!selectedFile || loading}
                  className={`py-3 px-6 rounded-lg transition-colors flex items-center space-x-2 ${
                    !selectedFile || loading
                      ? 'bg-gray-400 text-gray-200'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                  style={{
                    cursor: (!selectedFile || loading) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Start Processing</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {currentStep === 'processing' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Your File</h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                  {workflow.steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center space-x-1">
                        {getStepIcon(step, index)}
                        <span>{step.name}</span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Your task is processing</h4>
                <p className="text-gray-600">Please wait...</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">
                  Processing: {selectedFile?.name}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Status: {processingStatus || 'Starting...'}
                </p>
               
              </div>
            </div>
          )}

          {/* Step 4: Completed */}
          {currentStep === 'completed' && (
            <div className="text-center">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Complete</h3>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 mb-4">
                  {workflow.steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <div className="flex items-center space-x-1">
                        {getStepIcon(step, index)}
                        <span>{step.name}</span>
                      </div>
                      {index < workflow.steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Your document is ready</h4>
                <p className="text-gray-600 mb-4">
                  Your file processed successfully
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-blue-600" />
                  <div className="flex-1 text-left">
                    {isEditingFilename ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={customFilename}
                          onChange={(e) => setCustomFilename(e.target.value)}
                          className="font-medium text-gray-900 bg-white border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter filename"
                          autoFocus
                        />
                        <span className="text-gray-500">.{getOutputExtension(workflow)}</span>
                        <button
                          onClick={() => setIsEditingFilename(false)}
                          className="text-green-600 hover:text-green-800 text-sm font-medium"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            const baseName = selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'document';
                            setCustomFilename(`${baseName}_processed`);
                            setIsEditingFilename(false);
                          }}
                          className="text-gray-500 hover:text-gray-700 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">
                          {customFilename || selectedFile?.name?.replace(/\.[^/.]+$/, '') || 'document'}.{getOutputExtension(workflow)}
                        </p>
                        <button
                          onClick={() => setIsEditingFilename(true)}
                          className="p-1 text-gray-400 hover:text-gray-600"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-sm text-gray-600">Ready for download</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleDownload}
                  className="bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
