import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  MoreHorizontal,
  Filter,
  Download,
  Users,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { eSignApi } from '../../services/apiHelper';

const Dashboard: React.FC = () => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('recent');
  const [envelopes, setEnvelopes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchEnvelopes();
  }, []);
  
  const fetchEnvelopes = async () => {
    setLoading(true);
    try {
       const response = await eSignApi.get('/api/e-sign/get-envelopes');
       if (response.status == 200) {
        setEnvelopes(response.data.data);
       }
    } catch (error) {
      console.error('Error fetching envelopes:', error);
    } finally {
      setLoading(false);
    }
  };
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    voided: 'bg-gray-100 text-gray-600',
    declined: 'bg-red-100 text-red-800',
    "in-progress": 'bg-yellow-100 text-yellow-800', // Added
    "archived":'bg-red-100 text-red-800'//Added
  };

  const statusIcons = {
    draft: Clock,
    sent: FileText,
    pending: Clock,
    completed: CheckCircle,
    expired: AlertCircle,
    voided: AlertCircle,
    declined: AlertCircle,
    "in-progress": Clock, // added
    "archived": AlertCircle
  };

  const filteredEnvelopes = envelopes.filter(envelope => {
    if (filterStatus === 'all') return true;
    return envelope.status === filterStatus;
  });

  const sortedEnvelopes = [...filteredEnvelopes].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'subject') {
      return a.subject.localeCompare(b.subject);
    }
    if (sortBy === 'status') {
      return a.status.localeCompare(b.status);
    }
    return 0;
  });

  const stats = [
    {
      name: 'Total Envelopes',
      value: envelopes.length,
      icon: FileText,
      color: 'bg-blue-500'
    },
    {
      name: 'Pending Signatures',
      value: envelopes.filter(e => e.status === 'sent' || e.status === 'pending').length,
      icon: Clock,
      color: 'bg-yellow-500'
    },
    {
      name: 'Completed',
      value: envelopes.filter(e => e.status === 'completed').length,
      icon: CheckCircle,
      color: 'bg-green-500'
    },
    {
      name: 'This Month',
      value: envelopes.filter(e => {
        const created = new Date(e.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">E-Sign Dashboard</h1>
        </div>
        <Link
          to="/e-sign/create"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Envelope
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filter:</span>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="expired">Expired</option>
              <option value="voided">Voided</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recent">Most Recent</option>
                <option value="subject">Subject</option>
                <option value="status">Status</option>
              </select>
            </div>
            {/* <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button> */}
          </div>
        </div>
      </div>

      {/* Envelopes List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Envelopes</h2>
            {!loading && (
              <span className="text-sm text-gray-500">{sortedEnvelopes.length} envelopes</span>
            )}
          </div>
        </div>

        {loading ? (
            //Loader UI (Skeleton or Spinner)
            <div className="p-12 text-center">
              <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              <p className="text-gray-500">Loading envelopes...</p>
            </div>
          ) :
        sortedEnvelopes.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No envelopes found</h3>
            <p className="text-gray-500 mb-6">Get started by creating your first envelope.</p>
            <Link
              to="/e-sign/create"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Envelope
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sortedEnvelopes.map((envelope) => {
              const StatusIcon = statusIcons[envelope.status as keyof typeof statusIcons];
              const completedRecipients = envelope.recipients.filter((r: any) => r.status === 'completed' || r.status === 'signed').length;
              
              return (
                <div key={envelope.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusColors[envelope.status as keyof typeof statusIcons]}`}>
                          <StatusIcon className="w-5 h-5" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            to={`/e-sign/envelope/${envelope.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors truncate"
                          >
                            {envelope.subject}
                          </Link>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[envelope.status as keyof typeof statusIcons]}`}>
                            {envelope.status.charAt(0).toUpperCase() + envelope.status.slice(1)}
                          </span>
                          {envelope.priority === 'high' || envelope.priority === 'urgent' ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {envelope.priority === 'urgent' ? 'Urgent' : 'High'}
                            </span>
                          ) : null}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{completedRecipients}/{envelope.recipients.length} signed</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            <span>{envelope.documents.length} document{envelope.documents.length !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>Created {formatDistanceToNow(new Date(envelope.createdAt), { addSuffix: true })}</span>
                          </div>
                        </div>
                        
                        {envelope.message && (
                          <p className="text-sm text-gray-600 line-clamp-2">{envelope.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        to={`/e-sign/envelope/${envelope.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                      {/* <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button> */}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;