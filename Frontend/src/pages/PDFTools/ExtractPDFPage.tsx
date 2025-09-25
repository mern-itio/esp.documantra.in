import React, { useState } from 'react';
import ExtractPDF from '../../components/PDFService/ExtractPDF';
import type { ExtractPDFResponse } from '../../types/extractPDF';
import { FiDownload, FiX } from 'react-icons/fi';
// import { Link, useLocation } from 'react-router-dom';
// import { ArrowLeft } from 'lucide-react';

const ExtractPDFPage: React.FC = () => {
  const [extractResult, setExtractResult] = useState<ExtractPDFResponse | null>(null);
//  const location = useLocation();

  const handleExtractComplete = (result: ExtractPDFResponse) => {
    setExtractResult(result);
  };

  return (
    <div className="min-h-screen bg-gray-50">   

      {/* Main Content */}
      <div className="">
        <ExtractPDF onExtractComplete={handleExtractComplete} />
      </div>

      {/* Success/Error Modal */}
      {extractResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
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
                      onClick={async () => {
                        try {
                          // Import the service dynamically to avoid circular dependencies
                          const { extractPDFService } = await import('../../services/extractPDFService');
                          await extractPDFService.downloadExtractedPDF(extractResult.file!.filename);
                        } catch (error) {
                          console.error('Download error:', error);
                          alert('Failed to download file');
                        }
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
