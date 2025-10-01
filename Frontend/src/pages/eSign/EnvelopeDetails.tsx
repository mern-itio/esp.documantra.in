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
import ActionButton from '../../components/ESign/ActionButton';

const EnvelopeDetails: React.FC = () => { 
  const { id } = useParams<{ id: string }>();
  const [sending, setSending] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [cycles , setCycles] = useState<any[]>([]);
  const [openCycle, setOpenCycle] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState(false);
  const navigate = useNavigate();
  const {addAuditEntry } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  useEffect(() => {
    fetchEnvelopeDetails();
    fetchLogs();
  }, []);
  const [envelope, setEnvelope] = useState<any>(null);
  const fetchLogs = async () =>{
    try{
      const response = await eSignApi.get(`/api/e-sign/envelope/activity-log/${id}`);
      setLogs(response.data.logs || []);
    }catch (err){
      console.log(err);
    }
  }

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
  useEffect(() => {
    if(activeTab === 'signersCycle' && envelope?.isPowerForm == true){
      // setSigners
      const response = eSignApi.get(`/api/e-sign/envelope/signers/${id}`);
      response.then((res) => {
        if(res.status == 200){
           setCycles(res.data.cycles || []);
        }
      }).catch((err) => {
        console.log(err);
      })
    }
  },[activeTab, envelope]);

  if (!envelope) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Envelope Not Found</h2>
          <p className="text-gray-600 mb-6">The envelope you're looking for doesn't exist or has been removed.</p>
          <Link
            to="{/e-sign/dashboard}"
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
    declined: 'bg-red-100 text-red-800',
    "in-progress": 'bg-yellow-100 text-yellow-800', // Added
    "archived":'bg-red-100 text-red-800',//Added
    "active":"bg-green-100 text-green-800",
    "inactive":"bg-red-100 text-red-800"
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
    "archived": AlertCircle,
    "active":CheckCircle,
    "inactive":AlertCircle
  };

  const completedRecipients = envelope.recipients.filter((r: any) => r.status === 'completed' || r.status === 'signed').length;
  const StatusIcon = statusIcons[envelope.status as keyof typeof statusIcons] || FileText;

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Eye },
    {
      id: envelope.isPowerForm ? 'signersCycle' : 'recipients',
      name: envelope.isPowerForm ? 'Signer Cycle' : 'Recipients',
      icon: Users, // same icon for both
    },
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
  const envArchive = async() => {
    try{
        const response = await eSignApi.post('/api/e-sign/envelope/archive/'+id);
        if(response.status ==200){
          alert("Envelope archived successfully...");
          setEnvelope((prevEnvelope:any) => ({
            ...prevEnvelope,
            status: response.data.envelope.status, // or whatever new status was set
          }));
        }
    }catch (err){
      console.log(err);
    }
  }
  const envDelete = async() => {
    try{
        const response = await eSignApi.post('/api/e-sign/envelope/delete/'+id);
        if(response.status ==200){
          alert("Envelope Deleted successfully...")
           navigate(`/e-sign/dashboard`);
          console.log(response.data);
        }
    }catch (err){
      console.log(err);
    }
  }
  const envReminder = async() =>{
    try{
      const response = await eSignApi.post('/api/e-sign/envelope/reminder/'+id);
      if(response.status == 200){
        alert("Reminder has been sent to the pending recipients.");
      }
    }catch (err){
      console.log(err);
    }
  }
const handleDownloadSignedPdf = (id:String) => {
  const downloadUrl = `${import.meta.env.VITE_ESIGN_SERVICE_URL}/api/e-sign/signatures/download/${id}`;
  window.open(downloadUrl, '_blank');
};
const handleDownloadAll = () =>{
    const downloadUrl = `${import.meta.env.VITE_ESIGN_SERVICE_URL}/api/e-sign/signatures/download-all/${id}`;
  window.open(downloadUrl, '_blank');
}
const handleSendEnvelope = async () => {
    if (!id) return;
    setSending(true);
      try {
        await eSignApi.post(`/api/e-sign/send-envelope/${id}`);
        alert('Envelope sent successfully!');
        navigate('/e-sign/dashboard');
      } catch (err) {
        console.error(err);
        alert('Failed to send envelope. Try again.');
      } finally {
        setSending(false);
      }
    // In a real app, this would trigger email sending
    navigate('/e-sign/dashboard');
  };
const handleDuplicate = async () =>{
  if(!id) return;
  setDuplicating(true);
  try{
    const response = await eSignApi.get(`/api/e-sign/envelope/duplicate/${id}`);
      if(response.status== 201){
        alert('Envelope duplicated succesfully...');
        navigate('/e-sign/dashboard');
      }
  }catch (err){
    console.log(err);
  }finally {
    setDuplicating(false);
  }
}
const handleEmbed = () =>{
 navigate(`/e-sign/power-form-embed/${envelope?.powerFormId}/${envelope.id}`)
}

const handleAddSignature = (signerId: any) => {
  const url = `/e-sign/signer/${envelope.id}/${signerId}?self=1`;
  window.open(url, "_blank", "noopener,noreferrer");
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
          {/* Progress Bar */}
          {envelope?.isPowerForm !== true && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Progress</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(completedRecipients / envelope.recipients.length) * 100}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{completedRecipients}/{envelope.recipients.length}</span>
            </div>
          </div>
          )}
          {/* Progress Bar Ends */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Priority</p>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${
                envelope.priority === 'power-form'
                  ? 'bg-magenta-800 text-white'       // Dark magenta for power-form
                  : envelope.priority === 'high' || envelope.priority === 'urgent'
                  ? 'bg-red-100 text-red-800'        // Red for high/urgent
                  : 'bg-gray-100 text-gray-800'      // Gray for everything else
              }`}
            >
              {envelope.priority.charAt(0).toUpperCase() + envelope.priority.slice(1)}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Created</p>
            <p className="text-gray-900">{format(new Date(envelope.createdAt), 'MMM d, yyyy')}</p>
          </div>
          {envelope.sentAt && envelope?.isPowerForm !== true && (
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
            {envelope?.status === 'completed' && (
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => handleDownloadAll()}
              >
                <Download className="w-4 h-4" />
                  Download PDF
              </button>
            )}
            {envelope?.status === 'in-progress' && (
              <button
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => envReminder()}
              >
                <Send className="w-4 h-4" />
                Send Reminder
              </button>
            )}
              <ActionButton
                onClick={handleDuplicate}
                loading={duplicating}
                icon={<Copy className="w-4 h-4 text-gray-700" />}
                variant="secondary"
              >
              Duplicate
              </ActionButton>
          {envelope?.status === 'draft' && envelope?.isPowerForm !== true &&  (
            <ActionButton
              onClick={handleSendEnvelope}
              loading={sending}
              icon={<Send className="w-4 h-4 text-white" />}
              variant="primary"
            >
              Send Envelope
            </ActionButton>
          )}
          {envelope?.isPowerForm === true &&  (
            <ActionButton
              onClick={handleEmbed}
              loading={sending}
              icon={<Send className="w-4 h-4 text-white" />}
              variant="primary"
            >
              Power Form Embed
            </ActionButton>
          )}
         {envelope?.status != 'completed' && (
        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => navigate(`/e-sign/edit/${envelope?.id}`)}
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>

        )}
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
const renderCycles = () => {

  if (!cycles || cycles.length === 0) {
    return <div className="text-gray-500">No cycles found.</div>;
  }

  return (
    <div className="space-y-4">
      {cycles.map((cycle, cycleIndex) => {
        const isOpen = openCycle === cycle._id;

        return (
          <div key={cycle._id} className="border border-gray-200 rounded-xl shadow-sm bg-gray-50">
            {/* Cycle Header */}
            <button
              className="w-full flex justify-between items-center px-4 py-3 text-left focus:outline-none hover:bg-gray-100 rounded-t-xl"
              onClick={() => setOpenCycle(isOpen ? null : cycle._id)}
            >
              <span className="font-semibold text-gray-800 text-md">
                Cycle {cycleIndex + 1} ({cycle.signers.length} Signers)
              </span>
              <span className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}>
                ▼
              </span>
            </button>

            {/* Signers Content */}
            {isOpen && (
              <div className="space-y-4 p-4 border-t border-gray-200">
                {cycle.signers.map((signer: any, index: number) => (
                  <div
                    key={signer.signerId}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-lg font-semibold">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-lg font-semibold text-gray-900">
                            {signer.role === "creator" ? "Me" : signer.data?.Name || "N/A"}
                          </h4>
                          <p className="text-sm text-gray-600">{signer.role === "creator" ? "" : signer.data?.Email || "N/A"}</p>
                          <p className="text-sm text-gray-600 capitalize">{signer.role || "signer"}</p>
                          <p className="text-sm text-gray-600 capitalize">
                            {signer.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {signer.status !== "completed" && signer.status !== "submitted" && signer.role == "creator" && (
                          <button
                            onClick={() => handleAddSignature(signer.signerId)}
                            className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            Add Signature
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
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
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
               onClick={() => window.open(`/e-sign/signer/${envelope.id}/${document.id}`, "_blank")}
              >
                <Eye className="w-4 h-4" 
                />
                Preview
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={() => handleDownloadSignedPdf(document.id)}
              >
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
    {logs.length > 0 ? (
      logs.map((entry) => (
        <div key={entry._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-900 capitalize">
                  {entry.action.replace(/_/g, ' ')}
                </h4>
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-2 break-words">
                {typeof entry.details === 'object'
                  ? JSON.stringify(entry.details, null, 2)
                  : entry.details}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Type: {entry.type}</span>
              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
        <p className="text-gray-500">
          Activity will appear here as actions are taken on this envelope.
        </p>
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
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/e-sign/dashboard'))}
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
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
             onClick={()=>envArchive()}>
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
             onClick={()=>envDelete()}>
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
            {/* <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button> */}
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
          {activeTab === 'signersCycle' && renderCycles()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'activity' && renderActivity()}
        </div>
      </div>
    </div>
  );
};

export default EnvelopeDetails;