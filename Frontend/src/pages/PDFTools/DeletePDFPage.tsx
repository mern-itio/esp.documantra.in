import React, { useState } from 'react';
import DeletePDF from '../../components/PDFService/DeletePDF';
import type { DeletePDFResponse } from '../../types/deletePDF';
import { deletePDFService } from '../../services/deletePDFService';
import { FiDownload, FiX } from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const DeletePDFPage: React.FC = () => {
  const [deleteResult, setDeleteResult] = useState<DeletePDFResponse | null>(null);
 const location = useLocation();
  const handleDeleteResult = (result: DeletePDFResponse) => {
    // console.log('DeletePDFPage received result:', result);
    setDeleteResult(result);
    // console.log('Modal state updated, should show modal:', !!result);
  };

  const handleDownload = async (filePath: string, filename: string) => {
    try {
      await deletePDFService.downloadDeletedPDF(filePath, filename);
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
              <h1 className="text-3xl font-bold text-foreground">Delete PDF Pages</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Remove unwanted pages from your PDF documents with precision and ease
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        <DeletePDF onDeleteComplete={handleDeleteResult} />
      </div>

      {/* Success/Error Modal */}
      {deleteResult && (
        <div className="fixed inset-0  bg-background/50 backdrop-blur-xs flex items-center justify-center z-50">
            <div className="bg-background border border-border shadow-lg rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {deleteResult.success ? 'Pages Deleted Successfully!' : 'Deletion Failed'}
              </h3>
              <button
                onClick={() => setDeleteResult(null)}
                  className="text-muted-foreground hover:text-foreground"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4">
              {deleteResult.success ? (
                <div className="text-primary">
                  <p className="mb-2">{deleteResult.message}</p>
                  {deleteResult.deletedPages && (
                    <p className="text-sm text-muted-foreground mb-2">
                      Deleted pages: {deleteResult.deletedPages.join(', ')}
                    </p>
                  )}
                  {deleteResult.file && (
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-2">Download your updated PDF:</p>
                      <button
                        onClick={() => {
                          if (deleteResult.downloadUrl) {
                            handleDownload(deleteResult.downloadUrl, deleteResult.file?.filename || 'deleted_pages.pdf');
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
                  <p>{deleteResult.message || deleteResult.error}</p>
                </div>
              )}
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => setDeleteResult(null)}
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

export default DeletePDFPage;
