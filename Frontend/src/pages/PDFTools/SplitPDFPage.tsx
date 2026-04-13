import React, { useState } from 'react';
import { Download, AlertCircle, Scissors, ArrowLeft } from 'lucide-react';
import SplitPDF from '../../components/PDFService/SplitPDF';
import type { SplitPDFResponse } from '../../types/splitPDF';
import { Link, useLocation } from 'react-router-dom';

const SplitPDFPage: React.FC = () => {
   const location = useLocation();
  const [splitResult, setSplitResult] = useState<SplitPDFResponse | null>(null);

  const handleSplitComplete = (result: SplitPDFResponse) => {
    setSplitResult(result);
  };

  const downloadAllFiles = async () => {
    try {
      const { splitPDFService } = await import('../../services/splitPDFService');
      // Prefer ZIP download when available (consistent with success box behavior)
      if ((splitResult as any)?.zipFile) {
        await splitPDFService.downloadZipFile((splitResult as any).zipFile);
        return;
      }
      if (splitResult?.files && splitResult.files.length > 0) {
        await splitPDFService.downloadAllSplitPDFs(splitResult.files);
        return;
      }
      alert('No downloadable files found');
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download files');
    }
  };

  const isLandingRoute = location.pathname === '/split-pdf';
  const headingTitle = 'Split PDF files';
  const headingSubtitle = 'Divide your PDF into multiple files with precision and control.';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <Link
                   to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{headingTitle}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{headingSubtitle}</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-primary/10 text-primary text-xs font-medium px-3 py-1 rounded-full mb-4">
                  Advanced Tool
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLandingRoute && (
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <h2 className="text-2xl font-semibold text-foreground">{headingTitle}</h2>
          <p className="text-muted-foreground mt-2">{headingSubtitle}</p>
        </div>
      )}

      {/* Main Content */}
      <div className="py-6">
        <SplitPDF onSplitComplete={handleSplitComplete} />
      </div>

      {/* Success/Error Modal */}
      {splitResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-background rounded-xl p-6 max-w-md w-full mx-4">
            {splitResult.success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-success" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  PDF Split Successfully!
                </h3>
                <p className="text-muted-foreground mb-4">
                  Your PDF has been split into {splitResult.totalFiles} file{splitResult.totalFiles !== 1 ? 's' : ''}.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={downloadAllFiles}
                    className="w-full bg-primary text-foreground px-4 py-2 rounded-lg hover:bg-primary/80 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download All Files</span>
                  </button>
                  <button
                    onClick={() => setSplitResult(null)}
                    className="w-full bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
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
                  Split Failed
                </h3>
                <p className="text-muted-foreground mb-6">
                  {splitResult.error || 'An error occurred while splitting your PDF. Please try again.'}
                </p>
                <button
                  onClick={() => setSplitResult(null)}
                  className="bg-primary text-foreground px-6 py-2 rounded-lg hover:bg-primary/80 transition-colors"
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

export default SplitPDFPage;
