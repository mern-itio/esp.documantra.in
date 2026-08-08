import React, { useEffect, useState } from 'react';
import { useAuth } from '../../components/AuthService/AuthContext';
import { useTutorial } from '../../context/TutorialContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Users,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { eSignApi } from '../../services/apiHelper';
import { claimPublicGuestEnvelopes } from '../../services/claimPublicGuestEnvelopes';
import AIAuditInsights from '../../components/ESign/AIAuditInsights';
import { PageShell, PageHero, PagePanel, StatTile, SelectField, EmptyState } from '../../components/common/PageShell';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    showTutorial,
    tutorialStep,
    setShowTutorial,
    handleNextStep,
    handlePrevStep,
    handleCloseTutorial 
  } = useTutorial();

  // Show tutorial if first login
  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowTutorial(true);
    }
  }, [user]);
  const handleTutorialNext = async () =>{
    await handleNextStep();
     navigate('/e-sign/create');
  }
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
       await claimPublicGuestEnvelopes();
       const response = await eSignApi.get('/api/e-sign/get-envelopes');
       if (response.status == 200) {
        setEnvelopes(response.data.data);
       }
    } catch (error: any) {
      const status = error?.response?.status;
      if (status !== 401 && status !== 403 && status !== 404) {
        console.error('Error fetching envelopes:', error);
      }
    } finally {
      setLoading(false);
    }
  };
  const statusColors = {
    draft: 'dm-badge dm-badge--muted',
    sent: 'dm-badge dm-badge--primary',
    pending: 'dm-badge dm-badge--warning',
    completed: 'dm-badge dm-badge--success',
    expired: 'dm-badge dm-badge--danger',
    voided: 'dm-badge dm-badge--muted',
    declined: 'dm-badge dm-badge--danger',
    'in-progress': 'dm-badge dm-badge--warning',
    archived: 'dm-badge dm-badge--danger',
  };

  const statusIconBg = {
    draft: 'bg-muted text-muted-foreground',
    sent: 'bg-primary/10 text-primary',
    pending: 'bg-amber-50 text-amber-700',
    completed: 'bg-emerald-50 text-emerald-700',
    expired: 'bg-red-50 text-red-700',
    voided: 'bg-muted text-muted-foreground',
    declined: 'bg-red-50 text-red-700',
    'in-progress': 'bg-amber-50 text-amber-700',
    archived: 'bg-red-50 text-red-700',
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
    { name: 'Total Envelopes', value: envelopes.length, icon: FileText, accent: 'from-[#260559] to-[#5b3aa0]' },
    { name: 'Pending', value: envelopes.filter(e => e.status === 'sent' || e.status === 'in-progress').length, icon: Clock, accent: 'from-amber-500 to-orange-500' },
    { name: 'Completed', value: envelopes.filter(e => e.status === 'completed').length, icon: CheckCircle, accent: 'from-[#155E4B] to-emerald-500' },
    {
      name: 'This Month',
      value: envelopes.filter(e => {
        const created = new Date(e.createdAt);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length,
      icon: Calendar,
      accent: 'from-teal-600 to-cyan-500',
    },
  ];

  return (
    <PageShell wide>
      {/* Step-by-step Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 backdrop-blur-[2px]"></div>
          {/* Tutorial box position will be dynamically set based on step */}
          <div className={`bg-[#F7F3EE]/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-lg w-full absolute transition-all duration-300 ease-in-out min-h-[340px] flex flex-col justify-between ${
            tutorialStep === 1 ? 'top-24 right-8' :  // Create Envelope button position
            tutorialStep === 2 ? 'top-1/3 left-8' :  // Recipients section position
            tutorialStep === 3 ? 'bottom-1/3 right-8' : // Send button position
            tutorialStep === 4 ? 'top-1/2 left-8' :  // Status tracking position
            tutorialStep === 5 ? 'bottom-24 right-8' : // Completed documents position
            'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' // Welcome screen centered
          }`}>
            {tutorialStep === 0 && (
              <>
                <h2 className="text-2xl font-bold mb-4 text-center">Welcome to E-Signature!</h2>
                <p className="text-gray-700 text-center mb-6">Digitally sign, send, and manage your documents with ease. Let's walk through the main features.</p>
                <div className="flex-1" />
                <div className="flex justify-end gap-2 mt-6">
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Start Tutorial</button>
                </div>
              </>
            )}
            {tutorialStep === 1 && (
              <>
                <div className="relative">
                  {/* Arrow pointing to Create Envelope button */}
                  <div className="absolute -top-16 right-8 w-16 h-16">
                    <div className="w-16 h-16 border-t-4 border-r-4 border-blue-500 rounded-tr-xl transform rotate-45 absolute"></div>
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 1: Create an Envelope</h2>
                  <p className="text-gray-700 mb-4">Click <b>"Create Envelope"</b> to start a new signing workflow. You can upload documents, set a subject, and add a message for recipients.</p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleTutorialNext}>Next</button>
                </div>
              </>
            )}
            {tutorialStep === 2 && (
              <>
                <div className="relative">
                  {/* Arrow pointing to recipients section */}
                  <div className="absolute -left-16 top-8 w-16 h-16">
                    <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform -rotate-45 absolute"></div>
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 2: Add Recipients</h2>
                  <p className="text-gray-700 mb-4">Add one or more recipients and set their signing order. You can assign roles and add authentication if needed.</p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                </div>
              </>
            )}
            {tutorialStep === 3 && (
              <>
                <div className="relative">
                  {/* Arrow pointing to send button */}
                  <div className="absolute -right-16 bottom-8 w-16 h-16">
                    <div className="w-16 h-16 border-r-4 border-b-4 border-blue-500 rounded-br-xl transform rotate-45 absolute"></div>
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 3: Send for Signature</h2>
                  <p className="text-gray-700 mb-4">Once your envelope is ready, click <b>"Send"</b>. Recipients will receive an email to review and sign the document.</p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                </div>
              </>
            )}
            {tutorialStep === 4 && (
              <>
                <div className="relative">
                  {/* Arrow pointing to status tracking section */}
                  <div className="absolute -left-16 top-8 w-16 h-16">
                    <div className="w-16 h-16 border-l-4 border-t-4 border-blue-500 rounded-tl-xl transform -rotate-45 absolute"></div>
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 4: Track Status</h2>
                  <p className="text-gray-700 mb-4">Monitor the status of your envelopes in real time. See who has signed, who is pending, and send reminders if needed.</p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={handleNextStep}>Next</button>
                </div>
              </>
            )}
            {tutorialStep === 5 && (
              <>
                <div className="relative">
                  {/* Arrow pointing to completed documents section */}
                  <div className="absolute -right-16 bottom-8 w-16 h-16">
                    <div className="w-16 h-16 border-r-4 border-b-4 border-blue-500 rounded-br-xl transform rotate-45 absolute"></div>
                  </div>
                  <h2 className="text-xl font-bold mb-4">Step 5: Access Completed Documents</h2>
                  <p className="text-gray-700 mb-4">Download or review signed documents anytime from your dashboard. All your completed envelopes are securely stored.</p>
                </div>
                <div className="flex-1" />
                <div className="flex justify-between gap-2 mt-6">
                  <button className="px-4 py-2 bg-gray-200 rounded-lg" onClick={handlePrevStep}>Back</button>
                  <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700" onClick={handleCloseTutorial}>Finish</button>
                </div>
              </>
            )}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl"
              onClick={handleCloseTutorial}
              aria-label="Close tutorial"
            >
              &times;
            </button>
          </div>
        </div>
      )}
      <PageHero
        compact
        title="E-Sign Dashboard"
        subtitle="Track envelopes, send reminders, and monitor signing progress"
        action={
          <Link to="/e-sign/create" className="dm-btn-primary bg-white text-[#155E4B] hover:bg-white/90">
            <Plus className="h-4 w-4" />
            Create envelope
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatTile key={stat.name} label={stat.name} value={stat.value} icon={stat.icon} accent={stat.accent} />
        ))}
      </div>

      <PagePanel title="Find envelopes" noPadding bodyClassName="p-4 md:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <SelectField label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="sm:max-w-[200px]">
            <option value="all">All status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="expired">Expired</option>
            <option value="voided">Voided</option>
          </SelectField>
          <SelectField label="Sort by" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sm:max-w-[200px]">
            <option value="recent">Most recent</option>
            <option value="subject">Subject</option>
            <option value="status">Status</option>
          </SelectField>
        </div>
      </PagePanel>

      {envelopes.length > 0 && (
        <PagePanel noPadding bodyClassName="p-4 md:p-5">
          <AIAuditInsights />
        </PagePanel>
      )}

      <PagePanel title="Recent envelopes" subtitle={!loading ? `${sortedEnvelopes.length} shown` : undefined} noPadding bodyClassName="p-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-14">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
            <p className="mt-3 text-sm text-muted-foreground">Loading envelopes…</p>
          </div>
        ) : sortedEnvelopes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No envelopes yet"
            description="Create your first envelope to start collecting signatures."
            action={
              <Link to="/e-sign/create" className="dm-btn-primary">
                <Plus className="h-4 w-4" />
                Create envelope
              </Link>
            }
            className="border-0 bg-transparent shadow-none"
          />
        ) : (
          <div>
            {sortedEnvelopes.map((envelope) => {
              const StatusIcon = statusIcons[envelope.status as keyof typeof statusIcons];
              const completedRecipients = envelope.recipients.filter((r: any) => r.status === 'completed' || r.status === 'signed').length;

              return (
                <div key={envelope.id} className="dm-list-row">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 items-start gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${statusIconBg[envelope.status as keyof typeof statusIconBg] || statusIconBg.draft}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Link to={`/e-sign/envelope/${envelope.id}`} className="truncate text-base font-semibold text-foreground transition hover:text-primary">
                            {envelope.subject}
                          </Link>
                          <span className={statusColors[envelope.status as keyof typeof statusColors] || statusColors.draft}>
                            {envelope.status.charAt(0).toUpperCase() + envelope.status.slice(1)}
                          </span>
                          {envelope.isPowerForm && <span className="dm-badge bg-[#260559]/10 text-[#260559] ring-[#260559]/20">Power form</span>}
                          {(envelope.priority === 'high' || envelope.priority === 'urgent') && (
                            <span className="dm-badge dm-badge--danger">{envelope.priority === 'urgent' ? 'Urgent' : 'High'}</span>
                          )}
                        </div>
                        {envelope.isPowerForm === false && (
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1"><Users className="h-4 w-4" />{completedRecipients}/{envelope.recipients.length} signed</div>
                            <div className="flex items-center gap-1"><FileText className="h-4 w-4" />{envelope.documents.length} document{envelope.documents.length !== 1 ? 's' : ''}</div>
                            <div className="flex items-center gap-1"><Clock className="h-4 w-4" />Created {formatDistanceToNow(new Date(envelope.createdAt), { addSuffix: true })}</div>
                          </div>
                        )}
                        {envelope.message && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{envelope.message}</p>}
                      </div>
                    </div>
                    <Link to={`/e-sign/envelope/${envelope.id}`} className="dm-btn-secondary shrink-0 self-start sm:self-center">
                      <Eye className="h-4 w-4" />
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PagePanel>
    </PageShell>
  );
};

export default Dashboard;