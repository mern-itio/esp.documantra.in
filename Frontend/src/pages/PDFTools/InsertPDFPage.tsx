import React, { useState } from 'react';
import InsertPDF from '../../components/PDFService/InsertPDF';
import type { InsertPDFResponse } from '../../types/insertPDF';
import { FiDownload, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const InsertPDFPage: React.FC = () => {
  const [insertResult, setInsertResult] = useState<InsertPDFResponse | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleInsertResult = (result: InsertPDFResponse) => {
    setInsertResult(result);
    setShowModal(true);
  };

  const handleDownload = async () => {
    if (insertResult?.downloadUrl && insertResult?.file) {
      try {
        // Import the service dynamically to avoid circular dependencies
        const { insertPDFService } = await import('../../services/insertPDFService');
        await insertPDFService.downloadInsertedPDF(
          insertResult.downloadUrl,
          insertResult.file.filename
        );
      } catch (error) {
        console.error('Error downloading file:', error);
        alert('Failed to download file');
      }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setInsertResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
              to="/pdf-tools"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Insert PDF Pages</h1>
              <p className="mt-2 text-sm text-gray-600">
                Upload multiple PDF files, preview all pages, and drag & drop to reorder them.
                Create your perfect document by combining pages from different sources.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <InsertPDF onInsertResult={handleInsertResult} />
      </div>

      {/* Results Modal */}
      {showModal && insertResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              {/* Success State */}
              {insertResult.success ? (
                <div className="text-center">
                  <FiCheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Document Created Successfully!
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {insertResult.message}
                  </p>

                  {/* File Information */}
                  {insertResult.file && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                      <h4 className="font-medium text-gray-900 mb-2">File Information</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Filename:</span> {insertResult.file.filename}</p>
                        <p><span className="font-medium">Size:</span> {(insertResult.file.size / 1024 / 1024).toFixed(2)} MB</p>
                        {insertResult.totalInsertions && (
                          <p><span className="font-medium">Pages Combined:</span> {insertResult.totalInsertions}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={handleDownload}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                      <FiDownload className="w-5 h-5 mr-2" />
                      Download PDF
                    </button>
                    <button
                      onClick={closeModal}
                      className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                /* Error State */
                <div className="text-center">
                  <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Processing Failed
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {insertResult.error || insertResult.message || 'An error occurred while processing the document.'}
                  </p>

                  <button
                    onClick={closeModal}
                    className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsertPDFPage;
