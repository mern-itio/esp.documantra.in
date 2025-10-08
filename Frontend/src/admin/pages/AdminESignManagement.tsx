import React, { useState } from 'react';
import { DataTable, Button } from '../common';
import { 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock,
  Filter,
  Search,
  FileSignature,
  User
} from 'lucide-react';

const AdminESignManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortColumn, setSortColumn] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Mock data - replace with actual API calls
  const eSigns = [
    {
      id: '1',
      documentName: 'Contract_2024.pdf',
      initiator: 'john.doe@example.com',
      signers: ['jane.smith@example.com', 'bob.wilson@example.com'],
      status: 'pending',
      createdDate: '2024-01-15',
      expiryDate: '2024-01-22',
      progress: '2/3'
    },
    {
      id: '2',
      documentName: 'NDA_Agreement.pdf',
      initiator: 'alice.brown@example.com',
      signers: ['charlie.davis@example.com'],
      status: 'completed',
      createdDate: '2024-01-14',
      expiryDate: '2024-01-21',
      progress: '1/1'
    },
    {
      id: '3',
      documentName: 'Invoice_001.pdf',
      initiator: 'david.miller@example.com',
      signers: ['eve.johnson@example.com'],
      status: 'expired',
      createdDate: '2024-01-10',
      expiryDate: '2024-01-17',
      progress: '0/1'
    },
    {
      id: '4',
      documentName: 'Report_Q4.pdf',
      initiator: 'frank.garcia@example.com',
      signers: ['grace.lee@example.com', 'henry.taylor@example.com'],
      status: 'pending',
      createdDate: '2024-01-12',
      expiryDate: '2024-01-19',
      progress: '1/2'
    }
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const columns = [
    {
      key: 'documentName',
      label: 'Document Name',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <FileSignature className="w-4 h-4 text-gray-400 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'initiator',
      label: 'Initiator',
      sortable: true,
      render: (value: string) => (
        <div className="flex items-center">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-900">{value}</span>
        </div>
      )
    },
    {
      key: 'signers',
      label: 'Signers',
      render: (value: string[]) => (
        <div className="text-sm text-gray-900">
          {value.length > 1 ? `${value.length} signers` : value[0]}
        </div>
      )
    },
    {
      key: 'progress',
      label: 'Progress',
      render: (value: string, row: any) => (
        <div className="flex items-center">
          <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
            <div 
              className="bg-primary-600 h-2 rounded-full" 
              style={{ 
                width: `${(parseInt(value.split('/')[0]) / parseInt(value.split('/')[1])) * 100}%` 
              }}
            ></div>
          </div>
          <span className="text-xs text-gray-600">{value}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value: string) => getStatusBadge(value)
    },
    {
      key: 'createdDate',
      label: 'Created',
      sortable: true
    },
    {
      key: 'expiryDate',
      label: 'Expires',
      sortable: true,
      render: (value: string, row: any) => (
        <span className={`text-sm ${row.status === 'expired' ? 'text-red-600' : 'text-gray-900'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value: any, row: any) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleView(row.id)}
            icon={<Eye className="w-4 h-4" />}
          >
            View
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDownload(row.id)}
            icon={<Download className="w-4 h-4" />}
          >
            Download
          </Button>
          {row.status === 'pending' && (
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleCancel(row.id)}
              icon={<XCircle className="w-4 h-4" />}
            >
              Cancel
            </Button>
          )}
        </div>
      )
    }
  ];

  const handleView = (id: string) => {
    console.log('View e-sign:', id);
    // Implement view functionality
  };

  const handleDownload = (id: string) => {
    console.log('Download e-sign:', id);
    // Implement download functionality
  };

  const handleCancel = (id: string) => {
    console.log('Cancel e-sign:', id);
    // Implement cancel functionality
  };

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
    // Implement sorting logic
  };

  const filteredESigns = eSigns.filter(eSign => {
    const matchesSearch = eSign.documentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eSign.initiator.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || eSign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">E-Sign Management</h1>
        <p className="text-gray-600">Manage and monitor all e-signature processes</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search e-signatures..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button
                variant="outline"
                icon={<Filter className="w-4 h-4" />}
              >
                More Filters
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* E-Signs Table */}
      <div className="bg-white rounded-lg shadow">
        <DataTable
          data={filteredESigns}
          columns={columns}
          onSort={handleSort}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          emptyMessage="No e-signatures found"
        />
      </div>
    </div>
  );
};

export default AdminESignManagement;
