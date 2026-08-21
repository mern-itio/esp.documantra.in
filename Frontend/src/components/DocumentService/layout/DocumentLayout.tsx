import React from 'react';
import { DocumentHeader } from './DocumentHeader';
interface DocumentLayoutProps {
  children?: React.ReactNode;
}

export function DocumentLayout({ children }: DocumentLayoutProps) {
  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 flex-col overflow-hidden">
          <DocumentHeader />
          <main className="dm-main-bg flex-1 overflow-auto p-2 md:p-4">{children}</main>
        </div>
      </div>
    </div>
  );
}