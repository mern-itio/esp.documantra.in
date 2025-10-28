import { useEffect, useState } from 'react';
import { X, Mail, Eye, Edit, UserPlus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useDocumentStore } from '../../common/store/documentStore';
import { documentAPI } from '../../../services/api';
import { subscriptionApi } from '../../../services/apiHelper';
import { useSubscription } from '../../../context/SubscriptionContext';
import { SubscriptionStorage } from '../../../services/subscriptionService';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocuments: string[];
}

interface ShareRequest {
  email: string;
  permission: 'view' | 'edit' | 'comment';
  message?: string;
}

export function ShareModal({ isOpen, onClose, selectedDocuments }: ShareModalProps) {
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([
    { email: '', permission: 'view', message: '' }
  ]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { refreshData } = useDocumentStore();
  const { userPlan } = useSubscription();
  const [plan, setPlan] = useState<any>(() => SubscriptionStorage.getPlan());
  useEffect(() => {
    const load = () => setPlan(SubscriptionStorage.getPlan());
    load();
    const handler = () => load();
    window.addEventListener('subscription-plan-updated', handler);
    return () => window.removeEventListener('subscription-plan-updated', handler);
  }, [isOpen]);
  const effectivePlan: any = plan || userPlan;
  const creditsBalance = effectivePlan?.creditsBalance ?? 0;
  const shareCost = effectivePlan?.shareCosts?.credits ?? effectivePlan?.pdfShareCosts?.credits ?? effectivePlan?.documentCosts?.credits ?? 0;
  const remainingAfter = Math.max(0, creditsBalance - shareCost);

  const addShareRequest = () => {
    setShareRequests([...shareRequests, { email: '', permission: 'view', message: '' }]);
  };

  const removeShareRequest = (index: number) => {
    if (shareRequests.length > 1) {
      setShareRequests(shareRequests.filter((_, i) => i !== index));
    }
  };

  const updateShareRequest = (index: number, field: keyof ShareRequest, value: string) => {
    const updated = [...shareRequests];
    updated[index] = { ...updated[index], [field]: value };
    setShareRequests(updated);
  };

  const handleShare = async () => {
    if (selectedDocuments.length === 0) {
      setError('No documents selected for sharing');
      return;
    }

    // Validate email addresses
    const invalidEmails = shareRequests.filter(req => !req.email || !req.email.includes('@'));
    if (invalidEmails.length > 0) {
      setError('Please enter valid email addresses');
      return;
    }

    setIsSharing(true);
    setError(null);
    setSuccess(null);

    try {
      // Share each document with all users
      for (const documentId of selectedDocuments) {
        for (const shareRequest of shareRequests) {
          const response = await documentAPI.shareDocument(
            documentId,
            shareRequest.email,
            shareRequest.permission,
            shareMessage
          );

          if (!response.success) {
            throw new Error(`Failed to share document: ${response.message}`);
          }
        }
      }

      // Refresh localStorage credits via subscription balance endpoint using configured Axios instance
      try {
        const r = await subscriptionApi.get('/usage/balance');
        const creditsBalance = r?.data?.data?.creditsBalance;
        if (typeof creditsBalance === 'number') {
          const storedPlanRaw = localStorage.getItem('userSubscriptionPlan');
          if (storedPlanRaw) {
            const storedPlan = JSON.parse(storedPlanRaw);
            storedPlan.creditsBalance = creditsBalance;
            localStorage.setItem('userSubscriptionPlan', JSON.stringify(storedPlan));
            window.dispatchEvent(new Event('subscription-plan-updated'));
            setPlan(storedPlan);
          }
        }
      } catch {}

      setSuccess(`Successfully shared ${selectedDocuments.length} document(s) with ${shareRequests.length} user(s)`);
      
      // Refresh data to show updated sharing status
      await refreshData();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setShareRequests([{ email: '', permission: 'view', message: '' }]);
        setShareMessage('');
      }, 2000);

    } catch (error: any) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      const msg = error?.message || '';
      if (status === 402 && data && typeof data === 'object') {
        const required = Number(data.required || data?.requiredCredits || 0);
        const balance = Number(data.creditsBalance || data?.balance || 0);
        const shortage = required > balance ? (required - balance) : 0;
        const formatted = `Insufficient credits (need ${shortage} more). You have ${balance}, required ${required} for sharing.`;
        setError(formatted);
      } else if (/insufficient credits/i.test(msg)) {
        setError(msg);
      } else {
        setError(msg || 'Failed to share documents');
      }
    } finally {
      setIsSharing(false);
    }
  };

  // const getPermissionIcon = (permission: string) => {
  //   switch (permission) {
  //     case 'view':
  //       return <Eye className="w-4 h-4" />;
  //     case 'edit':
  //       return <Edit className="w-4 h-4" />;
  //     case 'comment':
  //       return <UserPlus className="w-4 h-4" />;
  //     default:
  //       return <Shield className="w-4 h-4" />;
  //   }
  // };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'view':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'edit':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'comment':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"   onClick={(e) => e.stopPropagation()} >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>

              <h2 className="text-xl font-semibold text-gray-900">Share Documents</h2>
              
              <p className="text-sm text-gray-500">
                Share {selectedDocuments.length} document(s) with collaborators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span><span className="font-medium">Credits:</span> {creditsBalance}</span>
              <span>•</span>
              <span><span className="font-medium">Cost per share:</span> {shareCost}</span>
              <span>•</span>
              <span><span className="font-medium">After share:</span> {remainingAfter}</span>
            </div>
          </div>
          {/* Share Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Share Message (Optional)
            </label>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          {/* Share Requests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Invite Collaborators
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addShareRequest}
                className="flex items-center space-x-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Another</span>
              </Button>
            </div>

            <div className="space-y-3">
              {shareRequests.map((request, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="collaborator@example.com"
                      value={request.email}
                      onChange={(e) => updateShareRequest(index, 'email', e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <select
                    value={request.permission}
                    onChange={(e) => updateShareRequest(index, 'permission', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="view">View Only</option>
                    <option value="comment">Comment</option>
                    <option value="edit">Edit</option>
                  </select>

                  {shareRequests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeShareRequest(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Permission Legend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Permission Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg border ${getPermissionColor('view')}`}>
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">View Only</div>
                  <div className="text-xs text-gray-500">Can view and download</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg border ${getPermissionColor('comment')}`}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Comment</div>
                  <div className="text-xs text-gray-500">Can view and add comments</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg border ${getPermissionColor('edit')}`}>
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Edit</div>
                  <div className="text-xs text-gray-500">Can view, edit, and comment</div>
                </div>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-sm text-green-700">{success}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSharing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleShare}
            disabled={isSharing || shareRequests.some(req => !req.email)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSharing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Sharing...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Share Documents
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
