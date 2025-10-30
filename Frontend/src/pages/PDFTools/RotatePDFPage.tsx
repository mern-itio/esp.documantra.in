import React, { useState } from 'react';
import RotatePDF from '../../components/PDFService/RotatePDF';
import type { RotatePDFResponse } from '../../types/rotatePDF';
import { rotatePDFService } from '../../services/rotatePDFService';
import { FiDownload, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const RotatePDFPage: React.FC = () => {
   const location = useLocation();
  const [rotateResult, setRotateResult] = useState<RotatePDFResponse | null>(null);

  const handleRotateResult = (result: RotatePDFResponse) => {
    setRotateResult(result);
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      await rotatePDFService.downloadRotatedPDF(filePath, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  const isLandingRoute = location.pathname === '/rotate-pdf';
  const headingTitle = 'Rotate PDF pages';
  const headingSubtitle = 'Rotate individual pages or apply batch rotations to your PDF documents.';

  return (
    <div className="min-h-screen bg-white">
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
              <h1 className="text-3xl font-bold text-gray-900">{headingTitle}</h1>
              <p className="mt-2 text-sm text-gray-600">{headingSubtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {isLandingRoute && (
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">{headingTitle}</h2>
          <p className="text-gray-600 mt-2">{headingSubtitle}</p>
        </div>
      )}

      <div className="py-6">
        <RotatePDF onRotateResult={handleRotateResult} />
      </div>

      {/* Success/Error Modal */}
      {rotateResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {rotateResult.success ? 'Pages Rotated Successfully!' : 'Rotation Failed'}
              </h3>
              <button
                onClick={() => setRotateResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              {rotateResult.success ? (
                <div className="text-green-600">
                  <p className="mb-2">{rotateResult.message}</p>
                  {rotateResult.rotations && (
                    <p className="text-sm text-gray-600 mb-2">
                      Rotated pages: {rotateResult.rotations.map(r => `Page ${r.page} (${r.angle}°)`).join(', ')}
                    </p>
                  )}
                  {rotateResult.file && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-2">Download your rotated PDF:</p>
                      <button
                        onClick={() => {
                          if (rotateResult.downloadUrl) {
                            handleDownload(rotateResult.downloadUrl, rotateResult.file?.filename || 'rotated_pages.pdf');
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
                  <p>{rotateResult.message || rotateResult.error}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setRotateResult(null)}
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

export default RotatePDFPage;
