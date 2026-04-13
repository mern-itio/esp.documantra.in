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
  const [plan, setPlan] = useState<Record<string, unknown> | null>(() =>
    SubscriptionStorage.getPlan() as Record<string, unknown> | null
  );
  useEffect(() => {
    const load = () =>
      setPlan(SubscriptionStorage.getPlan() as Record<string, unknown> | null);
    load();
    const handler = () => load();
    window.addEventListener('subscription-plan-updated', handler);
    return () => window.removeEventListener('subscription-plan-updated', handler);
  }, [isOpen]);
  const effectivePlan = (plan || userPlan) as Record<string, unknown> | null | undefined;
  const creditsBalance = Number(effectivePlan?.creditsBalance ?? 0);
  const shareCosts = effectivePlan?.shareCosts as Record<string, unknown> | undefined;
  const pdfShareCosts = effectivePlan?.pdfShareCosts as Record<string, unknown> | undefined;
  const documentCosts = effectivePlan?.documentCosts as Record<string, unknown> | undefined;
  const shareCost =
    Number(shareCosts?.credits ?? pdfShareCosts?.credits ?? documentCosts?.credits ?? 0);
  const remainingAfter = creditsBalance - shareCost;

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
            setPlan(storedPlan as Record<string, unknown>);
          }
        }
      } catch {
        /* noop */
      }

      setSuccess(`Successfully shared ${selectedDocuments.length} document(s) with ${shareRequests.length} user(s)`);
      
      // Refresh data to show updated sharing status
      await refreshData();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setShareRequests([{ email: '', permission: 'view', message: '' }]);
        setShareMessage('');
      }, 2000);

    } catch (error: unknown) {
      const ax = error as {
        response?: { status?: number; data?: Record<string, unknown> };
        message?: string;
      };
      const status = ax.response?.status;
      const data = ax.response?.data;
      const msg = ax.message || '';
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
        return 'border-primary/30 bg-primary/10 text-primary';
      case 'edit':
        return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300';
      case 'comment':
        return 'border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300';
      default:
        return 'border-border bg-muted text-muted-foreground';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm dark:bg-black/60">
      <div
        className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-card text-card-foreground shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-primary/10 p-2 dark:bg-primary/20">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div>

              <h2 className="text-xl font-semibold text-foreground">Share Documents</h2>
              
              <p className="text-sm text-muted-foreground">
                Share {selectedDocuments.length} document(s) with collaborators
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-accent"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div
            className={`mb-2 flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
              remainingAfter < 0
                ? 'border-destructive/30 bg-destructive/10 text-destructive dark:text-red-200'
                : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <span><span className="font-medium">Credits:</span> {creditsBalance}</span>
              <span>•</span>
              <span><span className="font-medium">Cost per share:</span> {shareCost}</span>
              <span>•</span>
              <span>
                <span className="font-medium">After share:</span>{' '}
                {remainingAfter < 0 ? (
                  <span className="font-semibold text-destructive">
                    {remainingAfter} ({Math.abs(remainingAfter)} credits required)
                  </span>
                ) : (
                  remainingAfter
                )}
              </span>
            </div>
          </div>
          {/* Share Message */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Share Message (Optional)
            </label>
            <textarea
              value={shareMessage}
              onChange={(e) => setShareMessage(e.target.value)}
              placeholder="Add a personal message to your invitation..."
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
            />
          </div>

          {/* Share Requests */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-foreground">
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
                    className="rounded-md border border-input bg-background px-3 py-2 text-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="view">View Only</option>
                    <option value="comment">Comment</option>
                    <option value="edit">Edit</option>
                  </select>

                  {shareRequests.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeShareRequest(index)}
                      className="rounded-md p-2 text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Permission Legend */}
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="mb-3 text-sm font-medium text-foreground">Permission Levels</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg border ${getPermissionColor('view')}`}>
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">View Only</div>
                  <div className="text-xs text-muted-foreground">Can view and download</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg border ${getPermissionColor('comment')}`}>
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Comment</div>
                  <div className="text-xs text-muted-foreground">Can view and add comments</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className={`p-2 rounded-lg border ${getPermissionColor('edit')}`}>
                  <Edit className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-medium">Edit</div>
                  <div className="text-xs text-muted-foreground">Can view, edit, and comment</div>
                </div>
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 dark:bg-destructive/20">
              <div className="text-sm text-destructive">{error}</div>
            </div>
          )}

          {success && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 dark:bg-emerald-950/40">
              <div className="text-sm text-emerald-800 dark:text-emerald-200">{success}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 border-t border-border p-6">
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
          >
            {isSharing ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
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
