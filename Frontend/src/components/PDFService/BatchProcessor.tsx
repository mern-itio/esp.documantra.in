import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Upload, 
  Play, 
  Trash2, 
  Download,
  Plus,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import * as Icons from 'lucide-react';
import type { BatchJob } from '../../types';
import { mockPDFTools } from '../../data/pdfMockData';
import { formatNumber, generateId } from '../../utils';

interface BatchProcessorProps {
  onBack: () => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ onBack }) => {
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [selectedTool, setSelectedTool] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // @ts-ignore - TypeScript can't infer the complex union type correctly
  const allTools = Object.values(mockPDFTools).flatMap(category => category.tools) as any[];

  const createNewJob = () => {
    if (!selectedTool) return;

    const tool = allTools.find(t => t.id === selectedTool);
    if (!tool) return;

    const newJob: BatchJob = {
      id: generateId(),
      name: `${tool.name} - ${new Date().toLocaleTimeString()}`,
      tool: selectedTool,
      files: [],
      status: 'pending',
      progress: 0
    };

    setJobs(prev => [newJob, ...prev]);
  };

  const addFilesToJob = (jobId: string, files: File[]) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId 
        ? { ...job, files: [...job.files, ...files] }
        : job
    ));
  };

  const removeJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
  };

  const startProcessing = async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.files.length === 0) return;

    setJobs(prev => prev.map(j => 
      j.id === jobId 
        ? { ...j, status: 'processing', progress: 0, startTime: new Date() }
        : j
    ));

    // Simulate processing
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setJobs(prev => prev.map(j => 
        j.id === jobId 
          ? { ...j, progress: i }
          : j
      ));
    }

    // Complete processing
    const results = job.files.map(file => ({
      filename: file.name,
      status: (Math.random() > 0.1 ? 'success' : 'error') as 'success' | 'error',
      message: Math.random() > 0.1 ? undefined : 'Processing failed'
    }));

    setJobs(prev => prev.map(j => 
      j.id === jobId 
        ? { 
            ...j, 
            status: 'completed' as const, 
            progress: 100, 
            endTime: new Date(),
            results 
          }
        : j
    ));
  };

  const startAllProcessing = async () => {
    setIsProcessing(true);
    const pendingJobs = jobs.filter(job => job.status === 'pending' && job.files.length > 0);
    
    for (const job of pendingJobs) {
      await startProcessing(job.id);
    }
    
    setIsProcessing(false);
  };

  const getToolIcon = (toolId: string) => {
    const tool = allTools.find(t => t.id === toolId);
    if (!tool) return Icons.FileText;
    
    // Safely access the icon from Icons object
    const iconName = (tool.icon || 'FileText') as keyof typeof Icons;
    const IconComponent = Icons[iconName];
    
    // Ensure we return a valid React component
    if (typeof IconComponent === 'function') {
      return IconComponent;
    }
    
    return Icons.FileText;
  };

  const getStatusColor = (status: BatchJob['status']) => {
    switch (status) {
      case 'pending': return 'text-gray-500 bg-gray-100';
      case 'processing': return 'text-blue-500 bg-blue-100';
      case 'completed': return 'text-green-500 bg-green-100';
      case 'error': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const completedJobs = jobs.filter(job => job.status === 'completed');
  // const totalFiles = jobs.reduce((sum, job) => sum + job.files.length, 0);
  const successfulFiles = completedJobs.reduce((sum, job) => 
    sum + (job.results?.filter(r => r.status === 'success').length || 0), 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Batch Processor</h1>
            <p className="text-gray-600">Process multiple files simultaneously</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 px-4 py-2">
            <div className="text-sm text-gray-600">Total Jobs</div>
            <div className="text-xl font-bold text-gray-900">{jobs.length}</div>
          </div>
          <div className="bg-[#F7F3EE] rounded-lg border border-gray-200 px-4 py-2">
            <div className="text-sm text-gray-600">Files Processed</div>
            <div className="text-xl font-bold text-green-600">{formatNumber(successfulFiles)}</div>
          </div>
        </div>
      </div>

      {/* Create New Job */}
      <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Batch Job</h3>
        
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <select
              value={selectedTool}
              onChange={(e) => setSelectedTool(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            >
              <option value="">Select a tool...</option>
              {Object.entries(mockPDFTools).map(([categoryId, category]) => (
                <optgroup key={categoryId} label={category.category}>
                  {category.tools.map(tool => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          
          <button
            onClick={createNewJob}
            disabled={!selectedTool}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Create Job</span>
          </button>
        </div>
      </div>

      {/* Jobs List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Batch Jobs ({jobs.length})
          </h3>
          
          {jobs.some(job => job.status === 'pending' && job.files.length > 0) && (
            <button
              onClick={startAllProcessing}
              disabled={isProcessing}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Process All</span>
            </button>
          )}
        </div>

        {jobs.length === 0 ? (
          <div className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-12 text-center">
            <RefreshCw className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No batch jobs yet</h4>
            <p className="text-gray-600">Create your first batch job to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const IconComponent = getToolIcon(job.tool);
              const tool = allTools.find(t => t.id === job.tool);
              
              return (
                <div key={job.id} className="bg-[#F7F3EE] rounded-xl border border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        {(() => {
                          const Icon = IconComponent as React.ComponentType<any>;
                          return <Icon className="w-5 h-5 text-blue-600" />;
                        })()}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{job.name}</h4>
                        <p className="text-sm text-gray-600">{tool?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                        {job.status}
                      </span>
                      <button
                        onClick={() => removeJob(job.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* File Upload Area */}
                  {job.status === 'pending' && (
                    <div className="mb-4">
                      <label className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <span className="text-sm text-gray-600">
                          Drop files here or click to upload ({job.files.length} files)
                        </span>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.tiff,.txt,.html"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            addFilesToJob(job.id, files);
                          }}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* Progress Bar */}
                  {job.status === 'processing' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Processing...</span>
                        <span className="text-sm text-gray-600">{job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Results */}
                  {job.status === 'completed' && job.results && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Results</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {job.results.map((result, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded-lg text-sm ${
                              result.status === 'success' 
                                ? 'bg-green-50 text-green-800' 
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            <div className="flex items-center space-x-1">
                              {result.status === 'success' ? (
                                <CheckCircle className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              <span className="truncate">{result.filename}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{job.files.length} files</span>
                      {job.startTime && (
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Started {job.startTime.toLocaleTimeString()}</span>
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {job.status === 'pending' && job.files.length > 0 && (
                        <button
                          onClick={() => startProcessing(job.id)}
                          className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Play className="w-3 h-3" />
                          <span>Start</span>
                        </button>
                      )}
                      
                      {job.status === 'completed' && (
                        <button className="flex items-center space-x-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
                          <Download className="w-3 h-3" />
                          <span>Download All</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};