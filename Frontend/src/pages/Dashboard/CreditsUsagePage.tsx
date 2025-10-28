import React from 'react';
import { Link } from 'react-router-dom';
import { subscriptionApi } from '../../services/apiHelper';
import { ArrowLeft } from 'lucide-react';

interface UsageRow {
  _id?: string;
  action: string;
  toolId?: string;
  creditsDelta: number;
  balanceAfter: number;
  createdAt: string;
  success?: boolean;
  reason?: string;
}

const CreditsUsagePage: React.FC = () => {
  const [balance, setBalance] = React.useState<number | null>(null);
  const [rows, setRows] = React.useState<UsageRow[]>([]);
  const [limit] = React.useState(20);
  const [loading, setLoading] = React.useState(true);
  const toolNameByIdRef = React.useRef<Record<string, string>>({});

  const load = React.useCallback(async (p: number) => {
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        subscriptionApi.get('/usage/balance'),
        subscriptionApi.get(`/usage/records?page=${p}&limit=${limit}`),
      ]);
      setBalance((bRes as any).data?.data?.creditsBalance ?? null);
      const payload = (rRes as any).data?.data || {};
      const recs = (payload.records || []) as UsageRow[];
     
      setRows(recs);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('toolCatalogNameMap');
      toolNameByIdRef.current = raw ? JSON.parse(raw) : {};
    } catch {}
    load(1);
  }, [load]);



  return (
    <div className="space-y-6 p-4 bg-white">
      <div className="relative">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Link to="/dashboard" aria-label="Back to Dashboard" className="inline-flex h-9 w-9 items-center justify-center text-gray-600 hover:bg-gray-50">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1  className="text-3xl font-bold text-gray-900">Credits & Usage</h1>
            </div>
            <p className="text-gray-600">Track your remaining credits and detailed usage history.</p>
          </div>
          <div className="bg-white rounded-xl shadow px-5 py-4 border border-gray-200">
            <div className="text-xs uppercase tracking-wide text-gray-500">Credits Balance</div>
            <div className="text-3xl font-extrabold text-gray-900">{loading && balance === null ? '—' : (balance ?? 0)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Usage History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tool</th> */}
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Balance After</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">{loading ? 'Loading...' : 'No usage found.'}</td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={r._id || i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">{r.action || 'usage'}</span>
                  </td>
                  {/* <td className="px-6 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span>{r.toolId ? (toolNameByIdRef.current[r.toolId] || r.toolId) : '—'}</span>
                    </div>
                  </td> */}
                  <td className={`px-6 py-4 text-sm text-right font-semibold ${r.creditsDelta < 0 ? 'text-red-600' : 'text-green-600'}`}>{r.creditsDelta}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-700 whitespace-nowrap">{r.balanceAfter}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.success === false ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>{r.success === false ? 'Failed' : 'Success'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CreditsUsagePage;


