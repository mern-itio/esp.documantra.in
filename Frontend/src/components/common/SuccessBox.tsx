import React from 'react';

interface SuccessBoxProps {
  title: string;
  subtitle: string;
  message: string;
  fileInfo?: {
    filename: string;
    size: number;
    pagesModified?: number;
    totalPages?: number;
    totalFiles?: number;
    extractedPages?: number;
    remainingPages?: number;
    rotations?: number;
    crops?: number;
    insertions?: number;
  };
  actions: {
    primary: {
      label: string;
      onClick: () => void;
      disabled?: boolean;
      icon?: React.ReactNode;
    };
    secondary?: {
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    };
    tertiary?: {
      label: string;
      onClick: () => void;
      icon?: React.ReactNode;
    };
  };
  backUrl?: string;
  backLabel?: string;
}

const SuccessBox: React.FC<SuccessBoxProps> = ({
   message,
  fileInfo,
  actions,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileInfoText = () => {
    if (!fileInfo) return '';
    
    const parts = [];
    if (fileInfo.pagesModified) parts.push(`${fileInfo.pagesModified} pages modified`);
    if (fileInfo.totalPages) parts.push(`${fileInfo.totalPages} total pages`);
    if (fileInfo.totalFiles) parts.push(`${fileInfo.totalFiles} files processed`);
    if (fileInfo.extractedPages) parts.push(`${fileInfo.extractedPages} pages extracted`);
    if (fileInfo.remainingPages) parts.push(`${fileInfo.remainingPages} pages remaining`);
    if (fileInfo.rotations) parts.push(`${fileInfo.rotations} pages rotated`);
    if (fileInfo.crops) parts.push(`${fileInfo.crops} crop areas applied`);
    if (fileInfo.insertions) parts.push(`${fileInfo.insertions} insertions applied`);
    
    return parts.join(' • ');
  };

  return (
    <div className="mx-auto space-y-6"> 
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-bold text-green-800 mb-3">
              {message}
            </h3>
            <p className="text-lg text-green-700 mb-8">
              Your PDF has been processed successfully and the updated document is ready for download.
            </p>
            
            {fileInfo && (
              <div className="bg-white border border-green-200 rounded-lg p-6 mb-8 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-gray-900 text-lg">{fileInfo.filename}</h4>
                    <p className="text-sm text-gray-600">
                      {formatFileSize(fileInfo.size)} • {getFileInfoText()}
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {/* Primary Action */}
              <button
                onClick={actions.primary.onClick}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                disabled={actions.primary.disabled}
              >
                {actions.primary.icon || (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                )}
                <span>{actions.primary.label}</span>
              </button>
              
              {/* Secondary Action */}
              {actions.secondary && (
                <button
                  onClick={actions.secondary.onClick}
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                >
                  {actions.secondary.icon || (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  )}
                  <span>{actions.secondary.label}</span>
                </button>
              )}
              
              {/* Tertiary Action */}
              {actions.tertiary && (
                <button
                  onClick={actions.tertiary.onClick}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                >
                  {actions.tertiary.icon || (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  )}
                  <span>{actions.tertiary.label}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessBox;
