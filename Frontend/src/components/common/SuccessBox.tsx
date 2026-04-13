import { ArrowLeft, CheckCircle, Download, File, RefreshCcw } from 'lucide-react';

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
        <div className="bg-gradient-to-r from-success/10 to-success/20 rounded-xl border-2 border-success p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-3">
              {message}
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Your PDF has been processed successfully and the updated document is ready for download.
            </p>
            
            {fileInfo && (
                <div className="bg-background border border-success rounded-lg p-6 mb-8 shadow-sm">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                    <File className="w-6 h-6 text-success" />
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="font-semibold text-foreground text-lg">{fileInfo.filename}</h4>
                    <p className="text-sm text-muted-foreground">
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
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                disabled={actions.primary.disabled}
              >
                {actions.primary.icon || (
                  <Download className="w-5 h-5" />
                )}
                <span>{actions.primary.label}</span>
              </button>
              
              {/* Secondary Action */}
              {actions.secondary && (
                <button
                  onClick={actions.secondary.onClick}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                >
                  {actions.secondary.icon || (
                    <ArrowLeft className="w-5 h-5" />
                  )}
                  <span>{actions.secondary.label}</span>
                </button>
              )}
              
              {/* Tertiary Action */}
              {actions.tertiary && (
                <button
                  onClick={actions.tertiary.onClick}
                  className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center space-x-2 text-base font-medium shadow-md"
                >
                  {actions.tertiary.icon || (
                    <RefreshCcw className="w-5 h-5" />
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
