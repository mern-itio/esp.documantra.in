import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Send,
  MoreHorizontal,
  Eye,
  Mail,
  Shield,
  Activity,
  User,
  Edit,
  Trash2,
  Copy,
  Archive
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDistanceToNow, format } from 'date-fns';
import { eSignApi } from '../../services/apiHelper';

const EnvelopeDetails: React.FC = () => { 
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {addAuditEntry } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => {
    fetchEnvelopeDetails();
  }, []);
  const [envelope, setEnvelope] = useState<any>(null);

  const fetchEnvelopeDetails = async () => {
      try {
         const response = await eSignApi.get('/api/e-sign/envelope/' + id);
         if (response.status == 200) {
          setEnvelope(response.data.data);
         }
      } catch (error) {
        console.error('Error fetching envelopes:', error);
      }
    };

  if (!envelope) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Envelope Not Found</h2>
          <p className="text-gray-600 mb-6">The envelope you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    sent: 'bg-blue-100 text-blue-800',
    pending: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    voided: 'bg-gray-100 text-gray-600',
    declined: 'bg-red-100 text-red-800'
  };

  const statusIcons = {
    draft: Clock,
    sent: FileText,
    pending: Clock,
    completed: CheckCircle,
    expired: AlertCircle,
    voided: AlertCircle,
    declined: AlertCircle
  };

  const completedRecipients = envelope.recipients.filter((r: any) => r.status === 'completed' || r.status === 'signed').length;
  const StatusIcon = statusIcons[envelope.status as keyof typeof statusIcons] || FileText;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Eye },
    { id: 'recipients', name: 'Recipients', icon: Users },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'activity', name: 'Activity', icon: Activity },
  ];

  const handleSendReminder = (recipientId: string) => {
    addAuditEntry(envelope.id, {
      envelopeId: envelope.id,
      action: 'reminder_sent',
      actor: 'system',
      details: `Reminder sent to recipient ${recipientId}`,
      ipAddress: '192.168.1.1'
    });
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Envelope Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Envelope Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Status</p>
            <div className="flex items-center gap-2">
              <StatusIcon className="w-5 h-5 text-gray-600" />
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${statusColors[envelope.status as keyof typeof statusColors]}`}>
                {envelope.status.charAt(0).toUpperCase() + envelope.status.slice(1)}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedRecipients / envelope.recipients.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{completedRecipients}/{envelope.recipients.length}</span>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Priority</p>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
              envelope.priority === 'high' || envelope.priority === 'urgent' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {envelope.priority.charAt(0).toUpperCase() + envelope.priority.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Created</p>
            <p className="text-gray-900">{format(new Date(envelope.createdAt), 'MMM d, yyyy')}</p>
          </div>
          {envelope.sentAt && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Sent</p>
              <p className="text-gray-900">{format(new Date(envelope.sentAt), 'MMM d, yyyy')}</p>
            </div>
          )}
          {envelope.expiresAt && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Expires</p>
              <p className="text-gray-900">{format(new Date(envelope.expiresAt), 'MMM d, yyyy')}</p>
            </div>
          )}
        </div>
        {envelope.message && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Message</p>
            <p className="text-gray-900">{envelope.message}</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Send className="w-4 h-4" />
            Send Reminder
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </div>
      </div>
    </div>
  );

  const renderRecipients = () => (
    <div className="space-y-4">
      {envelope.recipients.map((recipient:any, index:any) => (
        <div key={recipient.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
                {index + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{recipient.name}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    recipient.status === 'completed' || recipient.status === 'signed'
                      ? 'bg-green-100 text-green-800'
                      : recipient.status === 'viewed'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {recipient.status.charAt(0).toUpperCase() + recipient.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span>{recipient.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span className="capitalize">{recipient.role.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Shield className="w-4 h-4" />
                    <span className="capitalize">{recipient.authentication.replace('_', ' ')} authentication</span>
                  </div>
                  {recipient.viewedAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Eye className="w-4 h-4" />
                      <span>Viewed {formatDistanceToNow(new Date(recipient.viewedAt), { addSuffix: true })}</span>
                    </div>
                  )}
                  {recipient.signedAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4" />
                      <span>Signed {formatDistanceToNow(new Date(recipient.signedAt), { addSuffix: true })}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {recipient.status !== 'completed' && recipient.status !== 'signed' && (
                <button
                  onClick={() => handleSendReminder(recipient.id)}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                  Remind
                </button>
              )}
              <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4">
      {envelope.documents.map((document:any) => (
        <div key={document.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{document.name}</h4>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span>{document.pages} pages</span>
                  <span>{(document.size / 1024 / 1024).toFixed(2)} MB</span>
                  <span className="capitalize">{document.type.split('/')[1]} format</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderActivity = () => (
    <div className="space-y-4">
      {envelope.auditTrail?.map((entry:any) => (
        <div key={entry.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 capitalize">
                  {entry.action.replace('_', ' ')}
                </h4>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2">{entry.details}</p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Actor: {entry.actor}</span>
                <span>IP: {entry.ipAddress}</span>
                <span>{format(new Date(entry.timestamp), 'MMM d, yyyy HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>
      )) || (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
          <p className="text-gray-500">Activity will appear here as actions are taken on this envelope.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{envelope.subject}</h1>
              <p className="text-gray-600">
                Created {formatDistanceToNow(new Date(envelope.createdAt), { addSuffix: true })} by {envelope.sender.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'recipients' && renderRecipients()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'activity' && renderActivity()}
        </div>
      </div>
    </div>
  );
};

export default EnvelopeDetails;