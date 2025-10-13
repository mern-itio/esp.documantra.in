import React, { useEffect, useState } from 'react';
import { Save, ArrowLeft } from 'lucide-react';
import { adminApiService } from '../services/AdminApiService';
import { useNavigate, useParams } from 'react-router-dom';

const AdminPDFToolForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id && id !== 'new';
  const navigate = useNavigate();

  const [form, setForm] = useState<{ id: string; name: string; description?: string; category?: string; priority?: number }>({ id: '', name: '', description: '', category: 'general', priority: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      const res = await adminApiService.getPDFTool(id!);
      if (res.success && res.data) setForm({
        id: res.data.id,
        name: res.data.name,
        description: res.data.description || '',
        category: res.data.category || 'general',
        priority: typeof res.data.priority === 'number' ? res.data.priority : 0,
      });
      setLoading(false);
    })();
  }, [id, isEdit]);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: name === 'priority' ? Number(value) : value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = { id: form.id.trim(), name: form.name.trim(), description: form.description || '', category: form.category || 'general', priority: form.priority ?? 0 };
    const res = isEdit ? await adminApiService.updatePDFTool(id!, { name: payload.name, description: payload.description, category: payload.category, priority: payload.priority }) : await adminApiService.createPDFTool(payload);
    setSaving(false);
    if (res.success) {
      navigate('/admin/pdf-tools');
    } else {
      setError(res.error || 'Save failed');
    }
  };

  return (
    <div className="p-6 max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 px-3 py-2 border rounded inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4"/>Back</button>
      <h1 className="text-xl font-semibold mb-4">{isEdit ? 'Edit PDF Tool' : 'Add PDF Tool'}</h1>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium mb-1">Tool ID</label>
              <input name="id" value={form.id} onChange={onChange} required className="w-full border rounded px-3 py-2" placeholder="e.g. pdf-to-word"/>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input name="name" value={form.name} onChange={onChange} required className="w-full border rounded px-3 py-2" placeholder="PDF to Word"/>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea name="description" value={form.description} onChange={onChange} rows={4} className="w-full border rounded px-3 py-2" placeholder="Short description"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select name="category" value={form.category} onChange={onChange} className="w-full border rounded px-3 py-2">
                <option value="conversion">conversion</option>
                <option value="editing">editing</option>
                <option value="pages">pages</option>
                <option value="security">security</option>
                <option value="optimization">optimization</option>
                <option value="ocr">ocr</option>
                <option value="forms">forms</option>
                <option value="utilities">utilities</option>
                <option value="general">general</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Priority (lower shows first)</label>
              <input name="priority" type="number" value={form.priority ?? 0} onChange={onChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <div>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded inline-flex items-center gap-2">
              <Save className="w-4 h-4"/>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default AdminPDFToolForm;


