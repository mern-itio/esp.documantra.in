import React from 'react';
import { EmptyState } from '../common/EmptyState';
import Loader from '../../common/loader';
import { Upload, FolderOpen } from 'lucide-react';

export function TestComponents() {
  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Component Test</h1>
      
      <div className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">EmptyState Test</h2>
        <EmptyState
          icon={Upload}
          title="Test Title"
          description="Test description for the empty state component"
          action={
            <button className="px-4 py-2 bg-blue-600 text-white rounded">
              Test Action
            </button>
          }
        />
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Loader Test</h2>
        <Loader />
      </div>
      
      <div className="border p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Icons Test</h2>
        <div className="flex space-x-4">
          <Upload className="w-8 h-8 text-blue-600" />
          <FolderOpen className="w-8 h-8 text-green-600" />
        </div>
      </div>
    </div>
  );
}
