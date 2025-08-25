import React, { useState } from 'react';
import { Download, AlertCircle, Scissors, ArrowLeft } from 'lucide-react';
import SplitPDF from '../../components/PDFService/SplitPDF';
import type { SplitPDFResponse } from '../../types/splitPDF';
import { Link } from 'react-router-dom';

const SplitPDFPage: React.FC = () => {
  const [splitResult, setSplitResult] = useState<SplitPDFResponse | null>(null);

  const handleSplitComplete = (result: SplitPDFResponse) => {
    setSplitResult(result);
  };

  const downloadAllFiles = async () => {
    if (!splitResult?.files) return;
    
    try {
      // Import the service dynamically to avoid circular dependencies
      const { splitPDFService } = await import('../../services/splitPDFService');
      await splitPDFService.downloadAllSplitPDFs(splitResult.files);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download some files');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <Link
                to="/pdf-tools"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Split PDF Documents</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Divide your PDF into multiple files with precision and control
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                  Advanced Tool
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <SplitPDF onSplitComplete={handleSplitComplete} />
      </div>

      {/* Success/Error Modal */}
      {splitResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            {splitResult.success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Scissors className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  PDF Split Successfully!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your PDF has been split into {splitResult.totalFiles} file{splitResult.totalFiles !== 1 ? 's' : ''}.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={downloadAllFiles}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download All Files</span>
                  </button>
                  <button
                    onClick={() => setSplitResult(null)}
                    className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Split Failed
                </h3>
                <p className="text-gray-600 mb-6">
                  {splitResult.error || 'An error occurred while splitting your PDF. Please try again.'}
                </p>
                <button
                  onClick={() => setSplitResult(null)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
