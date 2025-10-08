import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../common';
import { 
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  DollarSign,
  Infinity as InfinityIcon
} from 'lucide-react';

type PlanType = 'free' | 'pro' | 'custom';

interface SubscriptionPlan {
  id: string;
  name: string;
  type: PlanType;
  price: number; // in USD per month
  isActive: boolean;
  conversionsLimitType: 'number' | 'unlimited';
  conversionsLimit?: number; // used when conversionsLimitType === 'number'
  description?: string;
}

const STORAGE_KEY = 'admin_subscription_plans';

const defaultPlans: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    type: 'free',
    price: 0,
    isActive: true,
    conversionsLimitType: 'number',
    conversionsLimit: 10,
    description: 'Basic access with limited conversions',
  },
  {
    id: 'pro',
    name: 'Pro',
    type: 'pro',
    price: 20,
    isActive: true,
    conversionsLimitType: 'unlimited',
    description: 'Professional plan with unlimited conversions',
  },
  {
    id: 'custom',
    name: 'Custom',
    type: 'custom',
    price: 49,
    isActive: true,
    conversionsLimitType: 'number',
    conversionsLimit: 100,
    description: 'Tailored plan; adjust pricing and limits as needed',
  },
];

const formatLimit = (plan: SubscriptionPlan) => {
  if (plan.conversionsLimitType === 'unlimited') return 'Unlimited';
  return typeof plan.conversionsLimit === 'number' ? `${plan.conversionsLimit}` : '—';
};

const AdminSubscriptionManagement: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditingId, setIsEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SubscriptionPlan | null>(null);

  // Initialize from storage
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setPlans(parsed);
          return;
        }
      } catch {}
    }
    setPlans(defaultPlans);
  }, []);

  // Persist to storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  }, [plans]);

  const filteredPlans = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return plans.filter(p =>
      p.name.toLowerCase().includes(term) ||
      p.type.toLowerCase().includes(term) ||
      `${p.price}`.includes(term)
    );
  }, [plans, searchTerm]);

  const resetForm = () => {
    setIsEditingId(null);
    setFormData(null);
  };

  const startCreate = () => {
    setIsEditingId('new');
    setFormData({
      id: `plan_${Date.now()}`,
      name: '',
      type: 'custom',
      price: 0,
      isActive: true,
      conversionsLimitType: 'number',
      conversionsLimit: 0,
      description: ''
    });
  };

  const startEdit = (plan: SubscriptionPlan) => {
    setIsEditingId(plan.id);
    setFormData({ ...plan });
  };

  const saveForm = () => {
    if (!formData) return;
    // Basic validation
    if (!formData.name.trim()) return;
    if (formData.conversionsLimitType === 'number' && (formData.conversionsLimit ?? 0) < 0) return;

    setPlans(prev => {
      const exists = prev.some(p => p.id === formData.id);
      if (exists) {
        return prev.map(p => (p.id === formData.id ? { ...formData } : p));
      }
      return [...prev, { ...formData }];
    });
    resetForm();
  };

  const removePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    if (isEditingId === id) resetForm();
  };

  const toggleActive = (id: string) => {
    setPlans(prev => prev.map(p => (p.id === id ? { ...p, isActive: !p.isActive } : p)));
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
        <p className="text-gray-600">Create, edit and manage pricing and conversion limits</p>
      </div>

      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search plans by name, type or price..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-4 pl-3 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div>
            <Button variant="primary" onClick={startCreate} icon={<Plus className="w-4 h-4" />}>Add Plan</Button>
          </div>
        </div>
      </div>

      {/* Plans Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversions Limit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredPlans.map((plan) => (
                <tr key={plan.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{plan.name}</div>
                    {plan.description && (<div className="text-xs text-gray-500">{plan.description}</div>)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 capitalize">{plan.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                    <DollarSign className="w-4 h-4 mr-1 text-gray-400" />{plan.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div className="inline-flex items-center text-gray-700">
                      {plan.conversionsLimitType === 'unlimited' ? (
                        <>
                          <InfinityIcon className="w-4 h-4 mr-1" />
                          Unlimited
                        </>
                      ) : (
                        <>{formatLimit(plan)}</>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${plan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {plan.isActive ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex space-x-2 justify-end">
                      <Button size="sm" variant="outline" onClick={() => startEdit(plan)} icon={<Edit className="w-4 h-4" />}>Edit</Button>
                      <Button size="sm" variant="outline" onClick={() => toggleActive(plan.id)}>
                        {plan.isActive ? 'Deactivate' : 'Activate'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => removePlan(plan.id)} icon={<Trash2 className="w-4 h-4" />}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPlans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No plans found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Drawer */}
      {isEditingId && formData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white w-full sm:w-[520px] h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto rounded-none sm:rounded-l-xl shadow-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{isEditingId === 'new' ? 'Add Plan' : 'Edit Plan'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., Free, Pro, Team, Enterprise"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value as PlanType })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent capitalize"
                  >
                    <option value="free">free</option>
                    <option value="pro">pro</option>
                    <option value="custom">custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD/month)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conversions Limit</label>
                <div className="flex items-center space-x-3">
                  <label className="inline-flex items-center space-x-1 text-sm">
                    <input
                      type="radio"
                      checked={formData.conversionsLimitType === 'number'}
                      onChange={() => setFormData({ ...formData, conversionsLimitType: 'number' })}
                    />
                    <span>Limited</span>
                  </label>
                  <label className="inline-flex items-center space-x-1 text-sm">
                    <input
                      type="radio"
                      checked={formData.conversionsLimitType === 'unlimited'}
                      onChange={() => setFormData({ ...formData, conversionsLimitType: 'unlimited', conversionsLimit: undefined })}
                    />
                    <span>Unlimited</span>
                  </label>
                </div>
                {formData.conversionsLimitType === 'number' && (
                  <div className="mt-2">
                    <input
                      type="number"
                      min={0}
                      value={formData.conversionsLimit ?? 0}
                      onChange={e => setFormData({ ...formData, conversionsLimit: Number(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g., 10"
                    />
                    <p className="text-xs text-gray-500 mt-1">Set 0 for no conversions, or any number.</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  placeholder="Optional description for this plan"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="inline-flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">Plan Active</span>
                </label>
                <div className="space-x-2">
                  <Button variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button variant="primary" onClick={saveForm}>Save</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSubscriptionManagement;


