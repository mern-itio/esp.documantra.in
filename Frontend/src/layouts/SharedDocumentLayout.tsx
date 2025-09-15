import React from 'react';
import { Outlet } from 'react-router-dom';

const SharedDocumentLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple header without navigation */}
    
      
      {/* Main content */}
      <main className="w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default SharedDocumentLayout;
