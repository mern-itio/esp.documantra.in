import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { documentTrackingService } from '../../services/documentTrackingService';
import { Eye, Download, FileText, User, Clock, AlertCircle } from 'lucide-react';
import { pdfApi } from '../../services/apiHelper';

const SharedDocumentPage: React.FC = () => {
  const { linkToken } = useParams<{ linkToken: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentInfo, setDocumentInfo] = useState<any>(null);

  useEffect(() => {
    if (!linkToken) {
      setError('Invalid link');
      setLoading(false);
      return;
    }

    const userId = user?.id || 'anonymous';

    // Access the shared document with user ID
    accessSharedDocument(linkToken, userId);
  }, [linkToken, user?.id]);

  const accessSharedDocument = async (token: string, userId: string) => {
    try {
      setLoading(true);
      
      // Call the backend to access the shared document
      const response = await pdfApi.post(`/shared-document/${token}`, {
        userId: userId
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error('Failed to access document');
      }

      // Get the document info
      const data = response.data;
      setDocumentInfo(data);
      
              // Log the document view with user ID
        if (data.documentId && data.documentName) {
          await documentTrackingService.logDocumentView(
            data.documentId,
            data.documentName,
            data.originalFilename || 'shared-document.pdf',
            { accessedVia: 'shared_link', linkToken: token }
          );
        }

      setLoading(false);
    } catch (err: any) {
      console.error('Error accessing shared document:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText
      });
      setError(err instanceof Error ? err.message : 'Failed to access document');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    window.open(`${pdfApi.defaults.baseURL}/shared-download/${linkToken}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Accessing shared document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F5F2EE] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EE] pt-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#F7F3EE] rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <FileText className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {documentInfo?.documentName || 'Shared Document'}
            </h1>
            <p className="text-gray-600">
              This document has been shared with you
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-[#F5F2EE] p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Accessed by</span>
              </div>
              <p className="text-gray-900">
                {user?.fullname || user?.email || 'Anonymous User'}
              </p>
            </div>

            <div className="bg-[#F5F2EE] p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Access Time</span>
              </div>
              <p className="text-gray-900">
                {new Date().toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.open(`${pdfApi.defaults.baseURL}/shared-download/${linkToken}`, '_blank')}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Eye className="h-5 w-5" />
              View Document
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download
            </button>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Document access has been logged for security purposes
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedDocumentPage;
