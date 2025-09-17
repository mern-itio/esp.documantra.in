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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center ">
              <Link
                   to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Merge PDF Documents</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Combine multiple PDF files into one document with custom ordering
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full mb-4">
                  Popular Tool
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <MergePDF onMergeComplete={handleMergeComplete} />
      </div>

      {/* Success/Error Modal */}
      {mergeResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            {mergeResult.success ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  PDFs Merged Successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  Your documents have been combined into a single PDF file.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={downloadMergedFile}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => setMergeResult(null)}
                    className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
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
                  Merge Failed
                </h3>
                <p className="text-gray-600 mb-6">
                  {mergeResult.error || 'An error occurred while merging your PDFs. Please try again.'}
                </p>
                <button
                  onClick={() => setMergeResult(null)}
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

export default MergePDFPage;
