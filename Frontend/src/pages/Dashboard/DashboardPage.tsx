import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/AuthService/AuthContext';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowTutorial(true);
    }
  }, [user]);

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    // Update localStorage so it doesn't show again
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.isFirstLogin = false;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
    } catch {}
  };

  const handleFeatureClick = (feature: string) => {
    setShowTutorial(false);
    // Optionally update localStorage as well
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        parsed.isFirstLogin = false;
        localStorage.setItem('userData', JSON.stringify(parsed));
      }
    } catch {}
    // Navigate to the selected feature
    if (feature === 'esign') navigate('/e-sign/dashboard');
    else if (feature === 'pdf') navigate('/pdf-tools');
    else if (feature === 'sharing') navigate('/document-sharing');
    // else do nothing (for dashboard explore)
  };
  const [balance, setBalance] = React.useState<number | null>(null);
  const [usage, setUsage] = React.useState<Array<{ action: string; creditsDelta: number; balanceAfter: number; createdAt: string; toolId?: string }>>([]);
  const toolNameByIdRef = React.useRef<Record<string, string>>({});
  const [loading, setLoading] = React.useState(true);
  const [envStatesLoading, setEnvStatesLoading] = React.useState(true);
  const [envelopeStats, setEnvelopeStats] = React.useState<any>(null);

  React.useEffect(() => {
    // get All envelope stats
    fetchAllEnvelopeStats();
  }
    , []);
  const fetchAllEnvelopeStats = async () => {
    try {
      setEnvStatesLoading(true);
      const response = await eSignApi.get('/api/e-sign/envelope/all-stats/user');
      const data = response.data;
      setEnvelopeStats(data);
      // Process the data as needed
    } catch (error) {
      console.error('Error fetching envelope stats:', error);
    } finally {
      setEnvStatesLoading(false);
    }
  };
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [bRes, uRes] = await Promise.all([
          subscriptionApi.get('/usage/balance'),
          subscriptionApi.get('/usage/records?limit=5'),
        ]);
        if (!mounted) return;
        setBalance((bRes as any).data?.data?.creditsBalance ?? null);
        try {
          const raw = localStorage.getItem('toolCatalogNameMap');
          toolNameByIdRef.current = raw ? JSON.parse(raw) : {};
        } catch { toolNameByIdRef.current = {}; }
        setUsage(((uRes as any).data?.data?.records || []).map((r: any) => ({ action: r.action, creditsDelta: r.creditsDelta, balanceAfter: r.balanceAfter, createdAt: r.createdAt, toolId: r.toolId })));
      } catch {
        if (!mounted) return;
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="space-y-6">
      {/* Advanced Tutorial Modal */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 backdrop-blur-[2px]"></div>
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-xl w-full relative">
            <h2 className="text-3xl font-bold mb-4 text-center">Welcome to Draft & Sign!</h2>
            <p className="text-lg text-gray-700 mb-6 text-center">Our system can do the following things:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button onClick={() => handleFeatureClick('esign')} className="flex flex-col items-center p-6 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition">
                <span className="text-4xl mb-2">✍️</span>
                <span className="font-semibold text-blue-700">E-Signature</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Send, sign, and manage documents digitally</span>
              </button>
              <button onClick={() => handleFeatureClick('pdf')} className="flex flex-col items-center p-6 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition">
                <span className="text-4xl mb-2">📝</span>
                <span className="font-semibold text-green-700">PDF Tools</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Edit, merge, split, and convert PDFs</span>
              </button>
              <button onClick={() => handleFeatureClick('sharing')} className="flex flex-col items-center p-6 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition">
                <span className="text-4xl mb-2">🔗</span>
                <span className="font-semibold text-purple-700">Document Sharing</span>
                <span className="text-xs text-gray-500 mt-1 text-center">Securely share documents with others</span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-gray-600 mb-2">or</span>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                onClick={handleCloseTutorial}
              >
                Explore the Dashboard
              </button>
            </div>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to Draft & Sign</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Envelopes</p>
              <p className="text-2xl font-semibold text-gray-900">{envStatesLoading ? 'Loading...' : envelopeStats?.totalEnvelopes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Envelopes</p>
              <p className="text-2xl font-semibold text-gray-900">{envStatesLoading ? 'Loading...' : envelopeStats?.completedEnvelopes}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⏳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-semibold text-gray-900">
                {envStatesLoading ? 'Loading...' : envelopeStats?.pendingEnvelopes ?? 0}
              </p>
            </div>
          </div>
        </div>
        <Link to="/credits-usage">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Credits Balance</p>
                <p className="text-2xl font-semibold text-gray-900">{loading ? '—' : (balance ?? 0)}</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Credit Usage</h2>
        <div className="space-y-3 mb-6">
          {usage.length === 0 && !loading && (
            <p className="text-sm text-gray-600">No recent usage.</p>
          )}
          {usage.map((u, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className={`w-2 h-2 rounded-full ${u.creditsDelta < 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
              <span className="text-sm text-gray-700">{u.action || 'usage'} {u.toolId ? `(${toolNameByIdRef.current[u.toolId] || u.toolId})` : ''}</span>
              <span className={`text-sm ml-auto font-medium ${u.creditsDelta < 0 ? 'text-red-600' : 'text-green-600'}`}>{u.creditsDelta}</span>
              <span className="text-xs text-gray-400 ml-3">{new Date(u.createdAt).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="mt-2">
          <Link to="/credits-usage" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">View details</Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
