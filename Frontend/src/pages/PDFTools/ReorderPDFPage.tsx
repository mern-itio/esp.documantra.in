import React, { useState } from 'react';
import ReorderPDF from '../../components/PDFService/ReorderPDF';
import type { ReorderPDFResponse } from '../../types/reorderPDF';
import { reorderPDFService } from '../../services/reorderPDFService';
import { FiDownload, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ReorderPDFPage: React.FC = () => {
   const location = useLocation();
  const [reorderResult, setReorderResult] = useState<ReorderPDFResponse | null>(null);

  const handleReorderResult = (result: ReorderPDFResponse) => {
    setReorderResult(result);
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      await reorderPDFService.downloadReorderedPDF(filePath, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with back button */}
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
              <h1 className="text-3xl font-bold text-gray-900">Reorder PDF Pages</h1>
              <p className="mt-2 text-sm text-gray-600">
                Drag and drop pages to create the perfect sequence for your document
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <ReorderPDF onReorderResult={handleReorderResult} />
      </div>

      {/* Success/Error Modal */}
      {reorderResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {reorderResult.success ? 'Pages Reordered Successfully!' : 'Reordering Failed'}
              </h3>
              <button
                onClick={() => setReorderResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              {reorderResult.success ? (
                <div className="text-green-600">
                  <p className="mb-2">{reorderResult.message}</p>
                  {reorderResult.newOrder && (
                    <p className="text-sm text-gray-600 mb-2">
                      New order: {reorderResult.newOrder.join(' → ')}
                    </p>
                  )}
                  {reorderResult.file && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Download your reordered PDF:</p>
                      <button
                        onClick={() => {
                          if (reorderResult.downloadUrl) {
                            handleDownload(reorderResult.downloadUrl, reorderResult.file?.filename || 'reordered_pages.pdf');
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <FiDownload className="w-4 h-4 mr-2" />
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-red-600">
                  <p>{reorderResult.message || reorderResult.error}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setReorderResult(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReorderPDFPage;
