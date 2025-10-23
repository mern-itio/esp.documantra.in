import React from 'react';
import { Link } from 'react-router-dom';
import { eSignApi, subscriptionApi } from '../../services/apiHelper';

const DashboardPage: React.FC = () => {
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Welcome to your Final Draft & Sign dashboard</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📄</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Envelopes</p>
              <p className="text-2xl font-semibold text-gray-900">{envStatesLoading? 'Loading...' : envelopeStats?.totalEnvelopes}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{envStatesLoading? 'Loading...' : envelopeStats?.completedEnvelopes}</p>
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
              <p className="text-2xl font-semibold text-gray-900">{envStatesLoading? 'Loading...' : envelopeStats.pendingEnvelopes}</p>
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
