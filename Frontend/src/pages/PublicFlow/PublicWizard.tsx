import { useRef, useState } from 'react';
import { eSignApi } from '../../services/apiHelper';

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
      alert('Upload failed');
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

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {step <= STEPS.length && (
          <div className="mb-10">
            <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
              <span>
                Step {step} of {STEPS.length}
              </span>
              <span>{STEPS[step - 1]}</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{
                  width: `${(step / STEPS.length) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 md:p-10">
          {step === 1 && (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Sign Documents Online
              </h1>
              <p className="text-slate-600 mb-8">
                Upload your PDF to get started
              </p>

              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    fileInputRef.current?.click();
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-blue-500 bg-blue-50'
                    : file
                      ? 'border-green-400 bg-green-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
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

                <div className="text-4xl mb-4">📄</div>
                <p className="text-lg font-medium text-slate-800 mb-1">
                  Drag &amp; Drop PDF
                </p>
                <p className="text-slate-500 mb-4">or</p>
                <span className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium">
                  Upload Document
                </span>

                {file && (
                  <p className="mt-6 text-sm text-green-700 font-medium">
                    Selected: {file.name}
                  </p>
                )}
              </div>

              <button
                onClick={uploadDocument}
                disabled={!file || loading}
                className="mt-8 w-full bg-blue-600 text-white px-6 py-3.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                {loading ? 'Uploading...' : 'Continue'}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Select Action
              </h2>
              <p className="text-slate-600 mb-8">
                What do you want to do with this document?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                    className={`text-left border-2 rounded-xl p-6 transition-all ${
                      option.disabled
                        ? 'border-slate-200 opacity-50 cursor-not-allowed'
                        : action === option.id
                          ? 'border-blue-600 bg-blue-50 shadow-sm'
                          : 'border-slate-200 hover:border-blue-400 hover:shadow-sm'
                    }`}
                  >
                    <span className="text-3xl block mb-3">
                      {option.icon}
                    </span>
                    <span className="block font-semibold text-slate-900 mb-1">
                      {option.label}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {option.description}
                    </span>
                    {option.disabled && (
                      <span className="inline-block mt-2 text-xs text-slate-400 uppercase tracking-wide">
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
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Who Needs To Sign
              </h2>
              <p className="text-slate-600 mb-8">
                Choose who will sign this document
              </p>

              <div className="space-y-3">
                {SIGN_MODE_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectSignMode(option.id)}
                    className={`w-full flex items-start gap-4 border-2 rounded-xl p-5 text-left transition-all ${
                      signMode === option.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-400'
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        signMode === option.id
                          ? 'border-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {signMode === option.id && (
                        <span className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                      )}
                    </span>
                    <span>
                      <span className="block font-semibold text-slate-900">
                        {option.label}
                      </span>
                      <span className="block text-sm text-slate-500 mt-0.5">
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
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Recipient Details
              </h2>
              <p className="text-slate-600 mb-8">
                Enter the name and email for each signer
              </p>

              {recipients.map((recipient, index) => (
                <div
                  key={index}
                  className="border border-slate-200 rounded-xl p-5 mb-4 bg-slate-50"
                >
                  <p className="text-sm font-medium text-slate-500 mb-3">
                    Signer {index + 1}
                  </p>
                  <input
                    placeholder="Full name"
                    value={recipient.name}
                    onChange={(e) =>
                      updateRecipient(index, 'name', e.target.value)
                    }
                    className="border border-slate-300 rounded-lg p-3 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Email address"
                    value={recipient.email}
                    onChange={(e) =>
                      updateRecipient(index, 'email', e.target.value)
                    }
                    className="border border-slate-300 rounded-lg p-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              ))}

              <button
                type="button"
                onClick={addRecipient}
                className="text-blue-600 font-medium hover:text-blue-700"
              >
                + Add Recipient
              </button>

              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateRecipients()) setStep(5);
                  }}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                Create Envelope
              </h2>
              <p className="text-slate-600 mb-8">
                Review your choices before opening the editor
              </p>

              <dl className="space-y-4 mb-8">
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Document</dt>
                  <dd className="font-medium text-slate-900 text-right">
                    {file?.name ?? '—'}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Action</dt>
                  <dd className="font-medium text-slate-900">
                    {actionLabel}
                  </dd>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-3">
                  <dt className="text-slate-500">Signing</dt>
                  <dd className="font-medium text-slate-900">
                    {signModeLabel}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 mb-2">Recipients</dt>
                  <dd className="space-y-2">
                    {recipients
                      .filter((r) => r.name.trim() && r.email.trim())
                      .map((r, i) => (
                        <div
                          key={i}
                          className="bg-slate-50 rounded-lg px-4 py-2 text-sm"
                        >
                          <span className="font-medium">{r.name}</span>
                          <span className="text-slate-500">
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
                  className="px-6 py-3 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={createEnvelope}
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3.5 rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 transition-colors"
                >
                  {loading
                    ? 'Creating envelope...'
                    : 'Open Editor'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
