import { useRef, useState } from 'react';
import { FileText, Info, Plus, ShieldCheck, Star } from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';
import { BRAND } from '../../config/brand';
import { isPublicSignOnlyApp } from '../../config/appMode';
import {
  PublicSignFooter,
  PublicSignHeader,
} from './PublicSignMarketingChrome';
import {
  getEsignMaxUploadLabel,
  getEsignUploadErrorMessage,
  isFileTooLargeForEsign,
} from '../../utils/uploadErrorMessage';

type Recipient = {
  name: string;
  email: string;
};

type ActionType = 'sign' | 'sign-notarize' | 'edit-fill';
type SignMode = 'me' | 'me-others' | 'others';

const ACTION_OPTIONS: {
  id: ActionType;
  label: string;
  icon: string;
  description: string;
  disabled?: boolean;
}[] = [
  {
    id: 'sign',
    label: 'Sign',
    icon: '✍',
    description: 'Collect signatures on your document',
  },
  {
    id: 'sign-notarize',
    label: 'Sign + Notarize',
    icon: '🔒',
    description: 'Sign and notarize online',
    disabled: true,
  },
  {
    id: 'edit-fill',
    label: 'Edit & Fill',
    icon: '📝',
    description: 'Fill fields before signing',
    disabled: true,
  },
];

const SIGN_MODE_OPTIONS: {
  id: SignMode;
  label: string;
  description: string;
}[] = [
  { id: 'me', label: 'Me Only', description: 'You are the only signer' },
  {
    id: 'me-others',
    label: 'Me + Others',
    description: 'You and other people will sign',
  },
  {
    id: 'others',
    label: 'Others Only',
    description: 'Only other people will sign',
  },
];

const STEPS = [
  'Upload Document',
  'Select Action',
  'Who Needs To Sign',
  'Recipient Details',
  'Create Envelope',
];

const accentBtn =
  'bg-[#1B7A4B] text-white hover:bg-[#15633D] disabled:opacity-50 disabled:cursor-not-allowed';
const accentBorder = 'border-[#1B7A4B]';
const accentSoft = 'bg-[#E8F5EE]';
const cardMint = 'bg-[#F0F9F4]';

export default function PublicWizard() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [envelopeId, setEnvelopeId] = useState('');
  const [action, setAction] = useState<ActionType>('sign');
  const [signMode, setSignMode] = useState<SignMode | ''>('');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: '', email: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    const isPdf =
      selected.type === 'application/pdf' ||
      /\.pdf$/i.test(selected.name);
    if (!isPdf) {
      alert('Please upload a PDF file');
      return;
    }
    if (isFileTooLargeForEsign(selected)) {
      alert(
        `"${selected.name}" is too large (${(selected.size / 1024 / 1024).toFixed(2)} MB). Maximum size is ${getEsignMaxUploadLabel()}.`
      );
      return;
    }
    setFile(selected);
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files?.[0] ?? null);
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      !(e.currentTarget as HTMLElement).contains(
        e.relatedTarget as Node
      )
    ) {
      setIsDragging(false);
    }
  };

  const uploadDocument = async () => {
    if (!file) {
      alert('Please select a PDF');
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append('files', file);
      formData.append('name', file.name);
      formData.append('subject', file.name);
      formData.append('envelopetype', 'Signature Request');

      const response = await eSignApi.post(
        '/api/e-sign/public/upload',
        formData
      );

      const id = response?.data?.data?.envelopeId;

      if (!id) {
        alert('Envelope creation failed');
        return;
      }

      setEnvelopeId(id);
      setStep(2);
    } catch (e) {
      console.error(e);
      alert(getEsignUploadErrorMessage(e, file?.name));
    } finally {
      setLoading(false);
    }
  };

  const selectSignMode = (mode: SignMode) => {
    setSignMode(mode);
    if (mode === 'me') {
      setRecipients([{ name: '', email: '' }]);
    } else if (mode === 'me-others') {
      setRecipients([
        { name: '', email: '' },
        { name: '', email: '' },
      ]);
    } else {
      setRecipients([{ name: '', email: '' }]);
    }
    setStep(4);
  };

  const addRecipient = () => {
    setRecipients([...recipients, { name: '', email: '' }]);
  };

  const updateRecipient = (
    index: number,
    field: 'name' | 'email',
    value: string
  ) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const validateRecipients = () => {
    const filled = recipients.filter(
      (r) => r.name.trim() && r.email.trim()
    );
    if (filled.length === 0) {
      alert('Please add at least one recipient with name and email');
      return false;
    }
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const r of filled) {
      if (!emailPattern.test(r.email.trim())) {
        alert(`Invalid email: ${r.email}`);
        return false;
      }
    }
    return true;
  };

  const createEnvelope = async () => {
    const filled = recipients.filter(
      (r) => r.name.trim() && r.email.trim()
    );

    try {
      setLoading(true);

      await eSignApi.post('/api/e-sign/public/add-recipients', {
        envelopeId,
        recipients: filled.map((r, index) => ({
          name: r.name.trim(),
          email: r.email.trim(),
          role: 'signer',
          order: index + 1,
        })),
      });

      window.location.href =
        `/public-sign/editor?step=3&envelopeId=${envelopeId}&public=true`;
    } catch (e: unknown) {
      console.error(e);
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to create envelope';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const signModeLabel =
    SIGN_MODE_OPTIONS.find((o) => o.id === signMode)?.label ?? '';
  const actionLabel =
    ACTION_OPTIONS.find((o) => o.id === action)?.label ?? '';

  const renderStepIndicator = () =>
    step <= STEPS.length ? (
      <div className="mb-8 w-full max-w-3xl">
        <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
          <span>
            Step {step} of {STEPS.length}
          </span>
          <span>{STEPS[step - 1]}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-[#1B7A4B] transition-all duration-300"
            style={{ width: `${(step / STEPS.length) * 100}%` }}
          />
        </div>
      </div>
    ) : null;

  return (
    <div className="min-h-screen bg-white">
      <PublicSignHeader />
      <main className="px-4 py-10 md:py-14">
        <div className="mx-auto flex max-w-4xl flex-col items-center">
        {step > 1 && renderStepIndicator()}

        {step === 1 && (
          <>
            <div className="mb-8 max-w-2xl text-center">
              <div className="mb-5 flex justify-center">
                <div
                  className={`flex h-16 w-16 items-center justify-center rounded-2xl ${accentSoft}`}
                >
                  <FileText className="h-9 w-9 text-[#1B7A4B]" strokeWidth={1.75} />
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
                Sign Documents Online
              </h1>
              <div className="mt-3 flex items-center justify-center gap-1 text-sm">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-amber-400 text-amber-400"
                  />
                ))}
                <span className="ml-1 text-gray-600">
                  4.9 (10,000+ reviews)
                </span>
              </div>
              <p className="mx-auto mt-4 max-w-xl text-base text-gray-600 md:text-lg">
                Upload your PDF and collect signatures online with one simple
                flow. Free to start — no sign-up required.
              </p>
            </div>

            <div
              className={`w-full rounded-2xl p-6 md:p-10 ${cardMint}`}
            >
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors md:py-16 ${
                  isDragging
                    ? `${accentBorder} bg-white`
                    : file
                      ? 'border-[#4CAF7A] bg-white'
                      : 'border-[#7BC49E] bg-transparent hover:bg-white/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={(e) =>
                    handleFileSelect(e.target.files?.[0] ?? null)
                  }
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mx-auto inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-[#1B7A4B] shadow-sm transition hover:shadow-md"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1B7A4B] text-white">
                    <Plus className="h-5 w-5" strokeWidth={2.5} />
                  </span>
                  Select PDF File
                </button>

                <p className="mt-5 text-base text-gray-700">
                  Or drop it here.
                </p>

                {file && (
                  <p className="mt-4 text-sm font-medium text-[#1B7A4B]">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-start justify-center gap-2 text-center text-sm text-gray-600">
                <ShieldCheck
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#1B7A4B]"
                  aria-hidden
                />
                <p>
                  Your files remain private and are transmitted securely over
                  HTTPS.
                  <Info
                    className="ml-1 inline h-4 w-4 text-gray-400"
                    aria-hidden
                  />
                </p>
              </div>

              {file && (
                <button
                  type="button"
                  onClick={uploadDocument}
                  disabled={loading}
                  className={`mt-6 w-full rounded-xl px-6 py-3.5 text-base font-semibold transition ${accentBtn}`}
                >
                  {loading ? 'Uploading...' : 'Continue'}
                </button>
              )}
            </div>

            <p className="mt-8 max-w-xl text-center text-sm text-gray-500">
              Learn more about{' '}
              <a
                href={isPublicSignOnlyApp() ? `${BRAND.website}/login` : '/login'}
                className="text-blue-600 hover:underline"
              >
                why {BRAND.name} is free
              </a>
              . Still have questions?{' '}
              <a
                href={`mailto:${BRAND.supportEmail}`}
                className="text-blue-600 hover:underline"
              >
                Feel free to contact us
              </a>
              .
            </p>
          </>
        )}

        {step > 1 && (
          <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:p-10">
            {step === 2 && (
              <>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                  Select Action
                </h2>
                <p className="mb-8 text-gray-600">
                  What do you want to do with this document?
                </p>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {ACTION_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => {
                        if (option.disabled) return;
                        setAction(option.id);
                        setStep(3);
                      }}
                      className={`rounded-xl border-2 p-6 text-left transition-all ${
                        option.disabled
                          ? 'cursor-not-allowed border-gray-200 opacity-50'
                          : action === option.id
                            ? `${accentBorder} ${accentSoft}`
                            : 'border-gray-200 hover:border-[#7BC49E] hover:shadow-sm'
                      }`}
                    >
                      <span className="mb-3 block text-3xl">
                        {option.icon}
                      </span>
                      <span className="mb-1 block font-semibold text-gray-900">
                        {option.label}
                      </span>
                      <span className="block text-sm text-gray-500">
                        {option.description}
                      </span>
                      {option.disabled && (
                        <span className="mt-2 inline-block text-xs uppercase tracking-wide text-gray-400">
                          Coming soon
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                  Who Needs To Sign
                </h2>
                <p className="mb-8 text-gray-600">
                  Choose who will sign this document
                </p>

                <div className="space-y-3">
                  {SIGN_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => selectSignMode(option.id)}
                      className={`flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all ${
                        signMode === option.id
                          ? `${accentBorder} ${accentSoft}`
                          : 'border-gray-200 hover:border-[#7BC49E]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          signMode === option.id
                            ? accentBorder
                            : 'border-gray-300'
                        }`}
                      >
                        {signMode === option.id && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#1B7A4B]" />
                        )}
                      </span>
                      <span>
                        <span className="block font-semibold text-gray-900">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block text-sm text-gray-500">
                          {option.description}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                  Recipient Details
                </h2>
                <p className="mb-8 text-gray-600">
                  Enter the name and email for each signer
                </p>

                {recipients.map((recipient, index) => (
                  <div
                    key={index}
                    className="mb-4 rounded-xl border border-gray-200 bg-gray-50 p-5"
                  >
                    <p className="mb-3 text-sm font-medium text-gray-500">
                      Signer {index + 1}
                    </p>
                    <input
                      placeholder="Full name"
                      value={recipient.name}
                      onChange={(e) =>
                        updateRecipient(index, 'name', e.target.value)
                      }
                      className="mb-3 w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1B7A4B]"
                    />
                    <input
                      type="email"
                      placeholder="Email address"
                      value={recipient.email}
                      onChange={(e) =>
                        updateRecipient(index, 'email', e.target.value)
                      }
                      className="w-full rounded-lg border border-gray-300 p-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#1B7A4B]"
                    />
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addRecipient}
                  className="font-medium text-[#1B7A4B] hover:text-[#15633D]"
                >
                  + Add Recipient
                </button>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (validateRecipients()) setStep(5);
                    }}
                    className={`flex-1 rounded-lg px-6 py-3 font-medium transition ${accentBtn}`}
                  >
                    Continue
                  </button>
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <h2 className="mb-2 text-2xl font-bold text-gray-900 md:text-3xl">
                  Create Envelope
                </h2>
                <p className="mb-8 text-gray-600">
                  Review your choices before opening the editor
                </p>

                <dl className="mb-8 space-y-4">
                  <div className="flex justify-between border-b border-gray-100 pb-3">
                    <dt className="text-gray-500">Document</dt>
                    <dd className="text-right font-medium text-gray-900">
                      {file?.name ?? '—'}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-3">
                    <dt className="text-gray-500">Action</dt>
                    <dd className="font-medium text-gray-900">
                      {actionLabel}
                    </dd>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-3">
                    <dt className="text-gray-500">Signing</dt>
                    <dd className="font-medium text-gray-900">
                      {signModeLabel}
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-2 text-gray-500">Recipients</dt>
                    <dd className="space-y-2">
                      {recipients
                        .filter((r) => r.name.trim() && r.email.trim())
                        .map((r, i) => (
                          <div
                            key={i}
                            className="rounded-lg bg-gray-50 px-4 py-2 text-sm"
                          >
                            <span className="font-medium">{r.name}</span>
                            <span className="text-gray-500">
                              {' '}
                              — {r.email}
                            </span>
                          </div>
                        ))}
                    </dd>
                  </div>
                </dl>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    disabled={loading}
                    className="rounded-lg border border-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={createEnvelope}
                    disabled={loading}
                    className={`flex-1 rounded-lg px-6 py-3.5 font-medium transition ${accentBtn}`}
                  >
                    {loading
                      ? 'Creating envelope...'
                      : 'Open Editor'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
        </div>
      </main>
      <PublicSignFooter />
    </div>
  );
}
