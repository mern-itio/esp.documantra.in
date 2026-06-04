import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../components/AuthService/AuthContext';
import { usePublicSign } from './PublicSignContext';
import { createPublicEnvelope } from './publicSignService';
import type { PublicRecipient } from './publicSignTypes';

function buildInitialRecipients(
  signerType: string | null,
  user: { fullname?: string; email?: string } | null
): PublicRecipient[] {
  const me: PublicRecipient = {
    id: 'me',
    name: user?.fullname || '',
    email: user?.email || '',
    isMe: true,
  };

  if (signerType === 'me-only') {
    return [me];
  }
  if (signerType === 'me-other') {
    return [me, { id: `r_${Date.now()}`, name: '', email: '' }];
  }
  return [{ id: `r_${Date.now()}`, name: '', email: '' }];
}

const RecipientPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { files, signerType, recipients, setRecipients } = usePublicSign();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (files.length === 0) {
      navigate('/public-sign', { replace: true });
      return;
    }
    if (!signerType) {
      navigate('/public-sign/signers', { replace: true });
      return;
    }
    if (recipients.length === 0) {
      setRecipients(buildInitialRecipients(signerType, user));
    }
  }, [files.length, signerType, navigate, recipients.length, setRecipients, user]);

  const updateRecipient = (id: string, patch: Partial<PublicRecipient>) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
    );
  };

  const addRecipient = () => {
    setRecipients((prev) => [
      ...prev,
      { id: `r_${Date.now()}`, name: '', email: '' },
    ]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.find((r) => r.id === id)?.isMe) return;
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  };

  const validate = (): boolean => {
    const invalid = recipients.filter(
      (r) =>
        !r.name.trim() ||
        !r.email.trim() ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim())
    );
    if (invalid.length > 0) {
      setFormError('Please enter a valid name and email for each signer.');
      return false;
    }
    return true;
  };

  const onSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    setFormError(null);
    try {
      const { envelopeId, publicFlowToken } = await createPublicEnvelope({
        files,
        recipients,
      });
      const publicQuery = publicFlowToken ? '&publicFlow=1' : '';
      window.location.href = `/e-sign/create?step=3&envelopeId=${envelopeId}${publicQuery}`;
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (err instanceof Error ? err.message : 'Something went wrong.');
      setFormError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const showMeBlock = signerType === 'me-only' || signerType === 'me-other';
  const showAddRecipient =
    signerType === 'me-other' || signerType === 'others-only';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Add recipients
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Enter who will sign this document. You can add more signers below.
      </p>

      <div className="mt-8 space-y-6">
        {showMeBlock &&
          recipients
            .filter((r) => r.isMe)
            .map((r) => (
              <section key={r.id}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Signer (Me)
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Name
                    </label>
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) =>
                        updateRecipient(r.id, { name: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">
                      Email
                    </label>
                    <input
                      type="email"
                      value={r.email}
                      onChange={(e) =>
                        updateRecipient(r.id, { email: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
              </section>
            ))}

        {recipients
          .filter((r) => !r.isMe)
          .map((r, index) => (
            <section key={r.id}>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                  Signer {index + 1}
                </h2>
                {recipients.filter((x) => !x.isMe).length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRecipient(r.id)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="Remove signer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Name
                  </label>
                  <input
                    type="text"
                    value={r.name}
                    onChange={(e) =>
                      updateRecipient(r.id, { name: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Email
                  </label>
                  <input
                    type="email"
                    value={r.email}
                    onChange={(e) =>
                      updateRecipient(r.id, { email: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  />
                </div>
              </div>
            </section>
          ))}

        {showAddRecipient && (
          <button
            type="button"
            onClick={addRecipient}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-3 text-sm font-semibold text-[#2563eb] hover:bg-sky-50"
          >
            <Plus className="h-4 w-4" />
            Add recipient
          </button>
        )}
      </div>

      {formError && (
        <p className="mt-4 text-center text-sm text-red-600" role="alert">
          {formError}
        </p>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate('/public-sign/signers')}
          disabled={submitting}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-full bg-[#2563eb] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? 'Creating envelope…' : 'Continue to place fields'}
        </button>
      </div>
    </div>
  );
};

export default RecipientPage;
