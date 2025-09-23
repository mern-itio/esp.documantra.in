import React from 'react';
import { CheckCircle, FileText, X, Calendar, HardDrive } from 'lucide-react';

interface FileUploadStatusProps {
  files: File[];
  uploadTimes?: Date[];
  onRemoveFile: (index: number) => void;
  onAddMoreFiles: () => void;
  acceptedFormats: string[];
  maxFiles?: number;
}

export const FileUploadStatus: React.FC<FileUploadStatusProps> = ({
  files,
  uploadTimes,
  onRemoveFile,
  onAddMoreFiles,
  acceptedFormats,
  maxFiles
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUploadTime = (index: number) => {
    const uploadTime = uploadTimes?.[index] || new Date();
    return uploadTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-gray-900">
          Uploaded Files ({files.length}{maxFiles ? `/${maxFiles}` : ''})
        </h4>
        <button
          onClick={onAddMoreFiles}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          + Add More Files
        </button>
      </div>
      
      <div className="space-y-3">
        {files.map((file, index) => (
          <div
            key={index}
            className="bg-green-50 border border-green-200 rounded-lg p-4 transition-all duration-200 hover:shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <h5 className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </h5>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <div className="flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>{formatFileSize(file.size)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatUploadTime(index)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Successfully uploaded
                    </span>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onRemoveFile(index)}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {acceptedFormats.length > 0 && (
        <div className="mt-3 text-xs text-gray-500">
          <span>Accepted formats: {acceptedFormats.join(', ')}</span>
        </div>
      )}
    </div>
  );
};
