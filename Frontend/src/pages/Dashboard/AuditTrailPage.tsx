import React from 'react';

const AuditTrailPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-600">Track all document activities and changes</p>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
        </div>
        <div className="divide-y divide-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Document signed</p>
                <p className="text-sm text-gray-500">Contract-2024.pdf by john.doe@example.com</p>
              </div>
              <span className="text-sm text-gray-400">2 hours ago</span>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Template created</p>
                <p className="text-sm text-gray-500">Invoice Template by admin@example.com</p>
              </div>
              <span className="text-sm text-gray-400">4 hours ago</span>
            </div>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Document uploaded</p>
                <p className="text-sm text-gray-500">Proposal.pdf by jane.smith@example.com</p>
              </div>
              <span className="text-sm text-gray-400">6 hours ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditTrailPage;
