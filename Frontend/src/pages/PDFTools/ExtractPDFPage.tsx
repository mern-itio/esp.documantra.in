import React, { useState } from 'react';
import ExtractPDF from '../../components/PDFService/ExtractPDF';
import type { ExtractPDFResponse } from '../../types/extractPDF';
import { FiDownload, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ExtractPDFPage: React.FC = () => {
  const [extractResult, setExtractResult] = useState<ExtractPDFResponse | null>(null);
 const location = useLocation();
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
             <Link
                  to={`/pdf-tools${location.search}`}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Extract PDF Pages</h1>
              <p className="mt-2 text-sm text-gray-600">
                Extract specific pages from your PDF documents with precision and ease
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <ExtractPDF />
      </div>

      {/* Success/Error Modal */}
      {extractResult && (
        <div className="fixed inset-0 bg-black backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            {extractResult.success ? (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <FiDownload className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Pages Extracted Successfully!
                  </h3>
                  <p className="text-sm text-gray-500">
                    Your PDF has been processed and is ready for download.
                  </p>
                </div>

                {extractResult.file && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {extractResult.file.filename}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {(extractResult.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => setExtractResult(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  {extractResult.file && (
                    <button
                      onClick={() => {
                        // Handle download here
                        setExtractResult(null);
                      }}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Download
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                    <FiX className="h-8 w-8 text-red-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Extraction Failed
                  </h3>
                  <p className="text-sm text-red-600">
                    {extractResult.error || 'An error occurred while extracting pages.'}
                  </p>
                </div>

                <button
                  onClick={() => setExtractResult(null)}
                  className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractPDFPage;
