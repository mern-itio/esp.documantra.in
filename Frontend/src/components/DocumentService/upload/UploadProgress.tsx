import { CheckCircle, XCircle, FileText, X } from 'lucide-react';
import type { UploadProgress as UploadProgressType } from '../../common/types';
import { Button } from '../ui/button';
import { formatFileSize } from '../../common/lib/utils';

interface UploadProgressProps {
  uploads: UploadProgressType[];
  onCancel?: (uploadId: string) => void;
}

export function UploadProgress({ uploads, onCancel }: UploadProgressProps) {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">
            Uploading {uploads.length} file{uploads.length !== 1 ? 's' : ''}
          </h3>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => uploads.forEach(upload => onCancel?.(upload.id))}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {uploads.map((upload) => (
          <div key={upload.id} className="px-4 py-3 border-b border-gray-100 last:border-b-0">
            <div className="flex items-center space-x-3">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {upload.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(upload.file.size)}
                </p>
              </div>

              {/* Status Icon */}
              <div className="flex-shrink-0">
                {upload.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {upload.status === 'error' && (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                {upload.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {upload.status === 'uploading' && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading...</span>
                  <span>{upload.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${upload.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {upload.status === 'error' && upload.error && (
              <p className="mt-1 text-xs text-red-600">{upload.error}</p>
            )}

            {/* Success Message */}
            {upload.status === 'success' && (
              <p className="mt-1 text-xs text-green-600">Upload complete</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}