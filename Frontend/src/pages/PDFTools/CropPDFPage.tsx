import React, { useState } from 'react';
import CropPDF from '../../components/PDFService/CropPDF';
import type { CropPDFResponse } from '../../types/cropPDF';
import { cropPDFService } from '../../services/cropPDFService';
import { FiDownload, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const CropPDFPage: React.FC = () => {
  const [cropResult, setCropResult] = useState<CropPDFResponse | null>(null);
 const location = useLocation();
  const handleCropResult = (result: CropPDFResponse) => {
    setCropResult(result);
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      await cropPDFService.downloadCroppedPDF(filePath, filename);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="bg-background shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Link
                 to={`/pdf-tools${location.search}`}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Crop PDF Pages</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Simple and intuitive PDF cropping with mouse selection
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <CropPDF onCropResult={handleCropResult} />
      </div>

      {/* Simple Success/Error Modal */}
      {cropResult && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-background border border-border shadow-lg rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {cropResult.success ? '✅ Pages Cropped Successfully!' : '❌ Cropping Failed'}
              </h3>
              <button
                onClick={() => setCropResult(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              {cropResult.success ? (
                <div className="text-primary">
                  <p className="mb-2">{cropResult.message}</p>
                  {cropResult.crops && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Cropped pages: {cropResult.crops.map(c => `Page ${c.page}`).join(', ')}
                    </p>
                  )}
                  {cropResult.file && (
                    <div className="mt-3">
                        <p className="text-sm text-muted-foreground mb-2">Download your cropped PDF:</p>
                      <button
                        onClick={() => {
                          if (cropResult.downloadUrl) {
                            handleDownload(cropResult.downloadUrl, cropResult.file?.filename || 'cropped_pages.pdf');
                          }
                        }}
                        className="inline-flex items-center px-4 py-2 bg-primary text-foreground rounded-md hover:bg-primary/80 transition-colors"
                      >
                        <FiDownload className="w-4 h-4 mr-2" />
                        Download PDF
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-destructive">
                  <p>{cropResult.message || cropResult.error}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setCropResult(null)}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
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

export default CropPDFPage;
