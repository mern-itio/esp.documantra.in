import React from 'react';
import { Link } from 'react-router-dom';
import { subscriptionApi } from '../../services/apiHelper';
import { ArrowLeft, CreditCard, TrendingUp, TrendingDown, CheckCircle2, XCircle, Clock, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [allRows, setAllRows] = React.useState<UsageRow[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [limit] = React.useState(10);
  const [loading, setLoading] = React.useState(true);
  const toolNameByIdRef = React.useRef<Record<string, string>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, rRes] = await Promise.all([
        subscriptionApi.get('/usage/balance'),
        subscriptionApi.get('/usage/records'),
      ]);
      setBalance((bRes as any).data?.data?.creditsBalance ?? null);
      const payload = (rRes as any).data?.data || {};
      const recs = (payload.records || []) as UsageRow[];
     
      setAllRows(recs);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('toolCatalogNameMap');
      toolNameByIdRef.current = raw ? JSON.parse(raw) : {};
    } catch {}
    load();
  }, [load]);

  // Calculate pagination
  const totalPages = Math.ceil(allRows.length / limit);
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const rows = allRows.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        for (let i = 2; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // In the middle
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };



  // Calculate statistics (based on all rows, not just current page)
  const totalUsed = allRows.filter(r => r.creditsDelta < 0).reduce((sum, r) => sum + Math.abs(r.creditsDelta), 0);
  // const totalAdded = allRows.filter(r => r.creditsDelta > 0).reduce((sum, r) => sum + r.creditsDelta, 0);
  const successCount = allRows.filter(r => r.success !== false).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link 
                to="/dashboard" 
                aria-label="Back to Dashboard" 
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-white hover:shadow-sm transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Credits & Usage</h1>
                <p className="text-sm text-gray-500 mt-1">Track your remaining credits and detailed usage history</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Compact Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Credits Balance Pill */}
          <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full shadow-md text-white">
            <CreditCard className="w-4 h-4 flex-shrink-0" />
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold">{loading && balance === null ? '—' : (balance ?? 0)}</span>
              <span className="text-xs opacity-90">Credits</span>
            </div>
          </div>

          {/* Total Used Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-1.5 rounded-full bg-red-100">
              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">{totalUsed}</span>
              <span className="text-xs text-gray-500">Used</span>
            </div>
          </div>

          {/* Total Added Pill */}
          {/* <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-1.5 rounded-full bg-green-100">
              <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">{totalAdded}</span>
              <span className="text-xs text-gray-500">Added</span>
            </div>
          </div> */}

          {/* Success Rate Pill */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white rounded-full shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="p-1.5 rounded-full bg-blue-100">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-gray-900">
                {rows.length > 0 ? Math.round((successCount / rows.length) * 100) : 0}%
              </span>
              <span className="text-xs text-gray-500">Success</span>
            </div>
          </div>
        </div>

        {/* Usage History Table */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-100">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Usage History</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {allRows.length > 0 ? (
                      <>Showing {startIndex + 1} - {Math.min(endIndex, allRows.length)} of {allRows.length} {allRows.length === 1 ? 'record' : 'records'}</>
                    ) : (
                      <>No records found</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Credits</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance After</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="p-4 rounded-full bg-gray-100 mb-3">
                          <Zap className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">{loading ? 'Loading usage history...' : 'No usage records found'}</p>
                        {!loading && <p className="text-sm text-gray-400 mt-1">Your credit transactions will appear here</p>}
                      </div>
                    </td>
                  </tr>
                )}
                {rows.map((r, i) => {
                  const date = new Date(r.createdAt);
                  const formattedDate = date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  const formattedTime = date.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  
                  return (
                    <tr 
                      key={r._id || i} 
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{formattedDate}</div>
                        <div className="text-xs text-gray-500">{formattedTime}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 group-hover:bg-indigo-100 transition-colors">
                          {r.action || 'usage'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.creditsDelta < 0 ? (
                            <>
                              <TrendingDown className="w-4 h-4 text-red-500" />
                              <span className="text-sm font-bold text-red-600">{r.creditsDelta}</span>
                            </>
                          ) : (
                            <>
                              <TrendingUp className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-bold text-green-600">+{r.creditsDelta}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-gray-900">{r.balanceAfter}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {r.success === false ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Failed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Success
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => {
                    if (page === '...') {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-gray-500">
                          ...
                        </span>
                      );
                    }
                    const pageNum = page as number;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        disabled={loading}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || loading}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreditsUsagePage;


