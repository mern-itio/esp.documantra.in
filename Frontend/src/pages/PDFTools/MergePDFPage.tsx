import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import MergePDF from '../../components/PDFService/MergePDF';
import { Link, useLocation } from 'react-router-dom';

const MergePDFPage: React.FC = () => {
  const location = useLocation();
  const [mergeResult, setMergeResult] = useState<{
    success: boolean;
    file?: File;
    error?: string;
  } | null>(null);

  const handleMergeComplete = (mergedFile: File) => {
    setMergeResult({
      success: true,
      file: mergedFile
    });
  };

  // const handleMergeError = (error: string) => {
  //   setMergeResult({
  //     success: false,
  //     error
  //   });
  // };

  const downloadMergedFile = () => {
    if (mergeResult?.file) {
      const url = URL.createObjectURL(mergeResult.file);
      const a = document.createElement('a');
      a.href = url;
      a.download = mergeResult.file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const isLandingRoute = location.pathname === '/merge-pdf';
  const headingTitle = 'Merge PDF files';
  const headingSubtitle = 'Combine multiple PDFs into a single document in your preferred order.';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center ">
              <Link
                   to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{headingTitle}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{headingSubtitle}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4">
                  Popular Tool
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Landing heading duplicate for marketing route */}
      {isLandingRoute && (
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">{headingTitle}</h2>
          <p className="text-muted-foreground mt-2">{headingSubtitle}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="py-6">
        <MergePDF onMergeComplete={handleMergeComplete} />
      </div>

      {/* Success/Error Modal */}
      {mergeResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl p-6 max-w-md w-full mx-4">
            {mergeResult.success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  PDFs Merged Successfully!
                </h3>
                <p className="text-muted-foreground mb-6">
                  Your documents have been combined into a single PDF file.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={downloadMergedFile}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setMergeResult(null)}
                    className="flex-1 bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Merge Failed
                </h3>
                <p className="text-muted-foreground mb-6">
                  {mergeResult.error || 'An error occurred while merging your PDFs. Please try again.'}
                </p>
                <button
                  onClick={() => setMergeResult(null)}
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/80 transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MergePDFPage;
