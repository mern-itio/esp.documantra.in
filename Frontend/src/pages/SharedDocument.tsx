import React from 'react';
import { useParams } from 'react-router-dom';
import SharedDocumentViewer from '../components/DocumentService/sharing/SharedDocumentViewer';

const SharedDocumentPage: React.FC = () => {
  const { shareToken } = useParams<{ shareToken: string }>();

  if (!shareToken) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Invalid Share Link</h1>
          <p className="text-gray-600">The share link is invalid or malformed.</p>
        </div>
      </div>
    );
  }

  return <SharedDocumentViewer shareToken={shareToken} />;
};

export default SharedDocumentPage;
