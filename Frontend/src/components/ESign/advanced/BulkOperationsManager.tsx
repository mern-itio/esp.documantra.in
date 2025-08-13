import React, { useState } from 'react';
import { 
  Upload, 
  Download, 
  Play, 
  Pause, 
  Square, 
  RefreshCw,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  MoreHorizontal,
  Filter,
  Search
} from 'lucide-react';
import { BulkOperation } from '../../types';
import { mockBulkOperations } from '../../data/mockData';

interface BulkOperationsManagerProps {
  onCreateBulkOperation: (operation: Omit<BulkOperation, 'id' | 'createdAt'>) => void;
}

const BulkOperationsManager: React.FC<BulkOperationsManagerProps> = ({
  onCreateBulkOperation
}) => {
  const [activeTab, setActiveTab] = useState('operations');
  const [operations] = useState<BulkOperation[]>(mockBulkOperations);
  const [selectedOperation, setSelectedOperation] = useState<BulkOperation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    pending: Clock,
    processing: RefreshCw,
    completed: CheckCircle,
    failed: AlertCircle,
    cancelled: X
  };

  const filteredOperations = operations.filter(op => 
    filterStatus === 'all' || op.status === filterStatus
  );

  const getProgressPercentage = (operation: BulkOperation) => {
    return operation.totalItems > 0 ? (operation.processedItems / operation.totalItems) * 100 : 0;
  };

  const renderCreateBulkOperation = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Bulk Operation</h3>
        <p className="text-gray-600">Process multiple envelopes or recipients at once.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bulk Envelope Creation */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Bulk Envelope Creation</h4>
          <p className="text-gray-600 mb-4">Create multiple envelopes from a CSV file or template.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div>• Upload CSV with recipient data</div>
            <div>• Select envelope template</div>
            <div>• Automatic field mapping</div>
            <div>• Batch processing</div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Start Bulk Creation
          </button>
        </div>

        {/* Bulk Sending */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Bulk Sending</h4>
          <p className="text-gray-600 mb-4">Send multiple draft envelopes to recipients.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div>• Select draft envelopes</div>
            <div>• Schedule sending time</div>
            <div>• Batch email delivery</div>
            <div>• Progress tracking</div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            Start Bulk Sending
          </button>
        </div>

        {/* Bulk Status Update */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Bulk Status Update</h4>
          <p className="text-gray-600 mb-4">Update status or properties of multiple envelopes.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div>• Select envelopes by criteria</div>
            <div>• Update status or properties</div>
            <div>• Bulk void or cancel</div>
            <div>• Audit trail maintenance</div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            Start Bulk Update
          </button>
        </div>

        {/* Bulk Reminders */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Bulk Reminders</h4>
          <p className="text-gray-600 mb-4">Send reminders to multiple pending recipients.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div>• Filter by pending status</div>
            <div>• Custom reminder messages</div>
            <div>• Scheduled delivery</div>
            <div>• Delivery tracking</div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
            Send Bulk Reminders
          </button>
        </div>

        {/* Bulk Export */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
            <Download className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Bulk Export</h4>
          <p className="text-gray-600 mb-4">Export envelope data and documents in bulk.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div>• Select export criteria</div>
            <div>• Multiple format options</div>
            <div>• Include audit trails</div>
            <div>• Compressed delivery</div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            Start Bulk Export
          </button>
        </div>

        {/* Template Operations */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer">
          <div className="w-12 h-12 bg-teal-100 text-teal-600 rounded-lg flex items-center justify-center mb-4">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">Template Operations</h4>
          <p className="text-gray-600 mb-4">Bulk operations using envelope templates.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <div>• Template-based creation</div>
            <div>• Variable field mapping</div>
            <div>• Conditional logic</div>
            <div>• Workflow automation</div>
          </div>
          <button className="w-full mt-4 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors">
            Use Templates
          </button>
        </div>
      </div>
    </div>
  );

  const renderOperationsList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>
          <p className="text-gray-600">Monitor and manage your bulk operations.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Operation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {filteredOperations.map((operation) => {
            const StatusIcon = statusIcons[operation.status];
            const progress = getProgressPercentage(operation);
            
            return (
              <div key={operation.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <StatusIcon className={`w-5 h-5 ${
                        operation.status === 'processing' ? 'animate-spin' : ''
                      } ${
                        operation.status === 'completed' ? 'text-green-600' :
                        operation.status === 'failed' ? 'text-red-600' :
                        operation.status === 'processing' ? 'text-blue-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-900 capitalize">
                          {operation.type.replace('_', ' ')}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[operation.status]}`}>
                          {operation.status.charAt(0).toUpperCase() + operation.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                        <div>
                          <span className="font-medium">Total Items:</span> {operation.totalItems}
                        </div>
                        <div>
                          <span className="font-medium">Processed:</span> {operation.processedItems}
                        </div>
                        <div>
                          <span className="font-medium">Successful:</span> {operation.successfulItems}
                        </div>
                        <div>
                          <span className="font-medium">Failed:</span> {operation.failedItems}
                        </div>
                      </div>
                      
                      {operation.status === 'processing' && (
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{progress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Created: {new Date(operation.createdAt).toLocaleDateString()}</span>
                        {operation.completedAt && (
                          <span>Completed: {new Date(operation.completedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setSelectedOperation(operation)}
                      className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    
                    {operation.status === 'processing' && (
                      <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('operations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'operations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Operations ({operations.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'create'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Create New
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'operations' && renderOperationsList()}
      {activeTab === 'create' && renderCreateBulkOperation()}

      {/* Operation Details Modal */}
      {selectedOperation && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setSelectedOperation(null)} />
            
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Operation Details: {selectedOperation.type.replace('_', ' ')}
                </h3>
                <button
                  onClick={() => setSelectedOperation(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Operation Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">{selectedOperation.totalItems}</div>
                    <div className="text-sm text-gray-600">Total Items</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{selectedOperation.successfulItems}</div>
                    <div className="text-sm text-gray-600">Successful</div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{selectedOperation.failedItems}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{getProgressPercentage(selectedOperation).toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Complete</div>
                  </div>
                </div>

                {/* Results Table */}
                {selectedOperation.results && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Operation Results</h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Item ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Envelope ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Error
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {selectedOperation.results.slice(0, 10).map((result, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.itemId}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  result.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {result.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {result.envelopeId || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                {result.error || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperationsManager;