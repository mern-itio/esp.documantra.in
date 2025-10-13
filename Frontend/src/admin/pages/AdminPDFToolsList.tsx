import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2, RefreshCw, ToggleLeft, ToggleRight } from 'lucide-react';
import { adminApiService } from '../services/AdminApiService';
import { Link, useNavigate } from 'react-router-dom';

const AdminPDFToolsList: React.FC = () => {
  const [tools, setTools] = useState<Array<{ id: string; name: string; description?: string; category?: string; priority?: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activation, setActivation] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return tools.filter(t => t.name.toLowerCase().includes(q) || (t.id?.toLowerCase().includes(q)) || (t.category || '').toLowerCase().includes(q));
  }, [tools, search]);

  const load = async () => {
    setLoading(true);
    const res = await adminApiService.listPDFTools();
    if (res.success && Array.isArray(res.data)) setTools(res.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(tools.map(async t => {
        const r = await adminApiService.getActivation(t.id);
        return [t.id, !!(r.success && r.data && (r.data as any).isActive)] as const;
      }));
      const map: Record<string, boolean> = {};
      entries.forEach(([id, val]) => { map[id] = val; });
      setActivation(map);
    })();
  }, [tools.length]);

  const onDelete = async (id: string) => {
    if (!confirm('Delete this tool?')) return;
    const res = await adminApiService.deletePDFTool(id);
    if (res.success) load();
  };

  const onToggleActive = async (id: string) => {
    const current = !!activation[id];
    const res = await adminApiService.setActivation(id, !current);
    if (res.success && res.data) {
      setActivation(prev => ({ ...prev, [id]: (res.data as any).isActive }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">PDF Tools</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="px-3 py-2 border rounded flex items-center gap-1"><RefreshCw className="w-4 h-4"/>Refresh</button>
          <Link to="/admin/pdf-tools/new" className="px-3 py-2 bg-blue-600 text-white rounded flex items-center gap-1"><Plus className="w-4 h-4"/>Add Tool</Link>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center border rounded px-3 py-2 gap-2">
          <Search className="w-4 h-4 text-gray-500"/>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, id, category" className="flex-1 outline-none"/>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Priority</th>
              <th className="text-left p-2">ID</th>
              <th className="text-left p-2">Name</th>
              <th className="text-left p-2">Category</th>
              <th className="text-left p-2">Status</th>
              <th className="text-right p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id} className="border-t">
                <td className="p-2 align-top">{t.priority ?? ''}</td>
                <td className="p-2 align-top font-mono">{t.id}</td>
                <td className="p-2 align-top">{t.name}</td>
                <td className="p-2 align-top">{t.category || 'general'}</td>
                <td className="p-2 align-top">
                  <button onClick={() => onToggleActive(t.id)} className="inline-flex items-center gap-1 px-2 py-1 border rounded">
                    {activation[t.id] ? (<><ToggleRight className="w-4 h-4 text-green-600"/>Active</>) : (<><ToggleLeft className="w-4 h-4 text-gray-500"/>Inactive</>)}
                  </button>
                </td>
                <td className="p-2 align-top text-right">
                  <button onClick={() => navigate(`/admin/pdf-tools/${encodeURIComponent(t.id)}`)} className="px-2 py-1 border rounded mr-2 inline-flex items-center gap-1"><Pencil className="w-4 h-4"/>Edit</button>
                  <button onClick={() => onDelete(t.id)} className="px-2 py-1 border rounded inline-flex items-center gap-1 text-red-600"><Trash2 className="w-4 h-4"/>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-gray-500">{loading ? 'Loading…' : 'No tools found'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPDFToolsList;


