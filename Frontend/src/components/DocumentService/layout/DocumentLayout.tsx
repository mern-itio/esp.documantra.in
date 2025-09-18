import React from 'react';
import { DocumentHeader } from './DocumentHeader';
interface DocumentLayoutProps {
  children?: React.ReactNode;
}

export function DocumentLayout({ children }: DocumentLayoutProps) {
  return (
    <div className=" bg-gray-50 flex flex-col ">   

      <div className="flex-1 flex overflow-hidden"> 
        <div className="flex-1 flex flex-col overflow-hidden">
          <DocumentHeader />
          <main className="flex-1 overflow-auto p-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}