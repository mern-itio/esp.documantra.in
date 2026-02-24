import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  ShieldCheck,
  Clock3,
  Zap,
  FileText,
  QrCode,
  Users,
  HelpCircle,
  X,
  Verified,
  UserCheck,
  FileCheck,
  Plus,
  Minus,
  Rocket,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { APP_NAME } from '../../components/constants/appConfig';
import DigitaCertificate from '../../components/LandingPage/DigitaCertificate';

type UploadFile = {
  id: string;
  file: File;
};

type FaqScenario = 'getting-started' | 'signing' | 'security' | 'after' | 'issues';

const FAQ_ITEMS: {
  id: string;
  scenario: FaqScenario;
  question: string;
  answer: string;
}[] = [
  {
    id: 'need-before',
    scenario: 'getting-started',
    question: 'What do I need before uploading a document?',
    answer:
      "You'll need the PDF document and the email address of the people who will sign. Each signer should have access to their email to receive agreement and OTPs during signing.",
  },
  {
    id: 'how-long',
    scenario: 'getting-started',
    question: 'How long does the full signing process usually take?',
    answer:
      'Preparing the document with fields is typically done in a few minutes. Once you share the secure link, each signer can review and complete their verification flow if added in the document and in about 1–2 minutes, depending on network conditions document will sign and receive the signed document via email.',
  },
  {
    id: 'supported-secure',
    scenario: 'signing',
    question: 'Which file types are supported and is it secure?',
    answer:
      'We support PDF only. Files are protected with encryption in transit and at rest, and signing links are sent only to the people you designate.',
  },
  {
    id: 'signature-look',
    scenario: 'signing',
    question: 'How does the signature appear on the PDF?',
    answer:
      'The signature appears as a digital block with the signer’s name, timestamp, giving you cryptographic proof instead of a simple image.',
  },
  {
    id: 'verify-later',
    scenario: 'security',
    question: 'Can I verify the signed PDF later?',
    answer:
      'Yes. Signed documents include a digital signature panel in standard PDF viewers to verify the original. Any change after signing invalidates the cryptographic seal.',
  },
  {
    id: 'legal-valid',
    scenario: 'security',
    question: 'Is eSign legally valid in India?',
    answer:
      'Yes. eSign is recognized under the IT Act, 2000 and carries a presumption of validity, so it is treated as valid unless proven otherwise.',
  },
  {
    id: 'multi-party',
    scenario: 'after',
    question: 'How do multiple signers get their copies?',
    answer:
      'Every signer receives an original, digitally signed PDF as soon as the process is complete. No need to print or forward—each party gets their own copy automatically.',
  },
  {
    id: 'no-otp',
    scenario: 'issues',
    question: "What if I don't receive the OTP?",
    answer:
      'Check that you’re using the email address linked to your email. Login OTPs are sent via your chosen channel (e.g. WhatsApp); the final signing OTP comes from UIDAI. If delays occur, try again after a short while.',
  },
];

const SCENARIO_STYLE: Record<
  FaqScenario,
  { label: string; accent: string; icon: React.ReactNode }
> = {
  'getting-started': {
    label: 'Getting started',
    accent: 'emerald',
    icon: <Rocket className="h-3.5 w-3.5" />,
  },
  signing: {
    label: 'Signing flow',
    accent: 'blue',
    icon: <FileText className="h-3.5 w-3.5" />,
  },
  security: {
    label: 'Trust & verification',
    accent: 'amber',
    icon: <Lock className="h-3.5 w-3.5" />,
  },
  after: {
    label: 'After signing',
    accent: 'violet',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  issues: {
    label: 'Troubleshooting',
    accent: 'rose',
    icon: <AlertCircle className="h-3.5 w-3.5" />,
  },
};

const UploadDocumentPage: React.FC = () => {
  const navigate = useNavigate();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;

    setUploadError(null);
    setUploadProgress(0);

    const next: UploadFile[] = [];
    let invalidCount = 0;
    const totalCount = fileList.length;
    let processedCount = 0;

    Array.from(fileList).forEach((file) => {
      processedCount += 1;
      // Only allow PDF files (by MIME type or .pdf extension)
      const isPdf =
        file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');

      if (!isPdf) {
        invalidCount += 1;
        return;
      }

      next.push({
        id: `${file.name}-${file.lastModified}-${Math.random()
          .toString(36)
          .slice(2)}`,
        file,
      });

      const progress = Math.round((processedCount / totalCount) * 100);
      setUploadProgress(progress);
    });

    if (invalidCount > 0) {
      setUploadError(
        next.length === 0
          ? 'Only PDF files can be uploaded. Please select a PDF document.'
          : `${invalidCount} non-PDF file(s) were skipped. Only PDF files are supported.`,
      );
    }

    if (next.length === 0) return;
    setFiles((prev) => [...prev, ...next].slice(0, 10)); // hard cap at 10 files
    setUploadProgress(100);
    setTimeout(() => setUploadProgress(null), 600);
  }, []);

  const onDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    // Only reset when actually leaving the drop zone, not entering children
    if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleInputChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    handleFiles(event.target.files);
    // reset to allow selecting same file again if needed
    event.target.value = '';
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen pt-24">
      {/* Hero + Upload Section */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 opacity-70">
          <div className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-sky-100 blur-2xl" />
          <div className="absolute -bottom-40 -right-16 h-80 w-80 rounded-full bg-indigo-100 blur-3xl" />
        </div>

        <div className="relative container-max px-4 p-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold text-primary shadow-sm ring-1 ring-sky-100">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[10px] text-primary">
                  ✓
                </span>
                Aadhaar-powered, OTP based signing
              </div>

              <h1 className="mt-4 heading text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-4xl">
                Upload & Sign in Minutes with
                <span className="block text-primary">{APP_NAME}</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              Bring PDFs into a guided eSign workflow. Define who signs where, share a secure private link, and track every step with a tamper-evident audit trail.
              </p>

              <dl className="mt-6 grid max-w-xl gap-4 text-xs text-slate-700 sm:grid-cols-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <div>
                    <dt className="font-semibold text-slate-900">IT Act compliant</dt>
                    {/* <dd>Legally recognized eSign in India.</dd> */}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-4 w-4 text-primary" />
                  <div>
                    <dt className="font-semibold text-slate-900">Takes a few minutes</dt>
                    {/* <dd>From upload to signed copy.</dd> */}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-purple-500" />
                  <div>
                    <dt className="font-semibold text-slate-900">Instant verification</dt>
                    {/* <dd>QR + certificate on every PDF.</dd> */}
                  </div>
                </div>
              </dl>
            </div>

            {/* Right: upload panel */}
            <div className="lg:pl-6">
              <div className="relative rounded-2xl">
                {/* <div className="absolute inset-x-10 -top-1 h-px bg-gradient-to-r from-sky-500/0 via-sky-500/70 to-sky-500/0" /> */}

                <header className="flex items-start justify-between gap-3">

                  <span className="inline-flex items-end text-end gap-1 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-700">
                    <Zap className="h-3 w-3" />
                    No account needed for signers
                  </span>
                </header>

                <div
                  className={`mt-4 flex flex-col items-center justify-center rounded-xl  border-2 border-dashed p-6 text-center transition ${isDragging
                    ? 'border-primary bg-sky-50/80'
                    : 'border-gray-500 hover:border-primary/70 hover:bg-sky-50/60'
                    }`}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                >
                  <UploadCloud
                    className={`mb-2 h-8 w-8 ${isDragging ? 'text-primary' : 'text-slate-400'
                      }`}
                  />
                  <p className="text-sm font-semibold text-slate-900">
                    Drop your files here
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    or click to browse from your device
                  </p>

                  <label className="mt-3 inline-flex items-center justify-center rounded-full bg-[#084bdc] px-5 py-2 text-xs font-semibold text-white cursor-pointer shadow-sm hover:bg-primary/90">
                    <span>Browse files</span>
                    <input
                      type="file"
                      accept=".pdf"
                      multiple
                      onChange={handleInputChange}
                      className="hidden"
                    />
                  </label>

                  <p className="mt-2 text-[10px] text-slate-500">
                    You can upload multiple files. <br /> Supported formats: PDF only.

                  </p>

                  {uploadError && (
                    <p className="mt-1 text-[11px] font-medium text-red-600">
                      {uploadError}
                    </p>
                  )}

                  {uploadProgress !== null && (
                    <div className="mt-3 w-full max-w-xs">
                      <div className="mb-1 flex items-center justify-between text-[10px] text-slate-600">
                        <span>Uploading files…</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-[#084bdc] transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Selected files list */}
                {files.length > 0 && (
                  <div className="mt-4 rounded-xl bg-slate-50/80 p-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-800">
                        {files.length} file{files.length > 1 ? 's' : ''} ready
                      </span>
                      <button
                        type="button"
                        onClick={() => setFiles([])}
                        className="text-[11px] font-semibold text-primary hover:underline"
                      >
                        Clear all
                      </button>
                    </div>

                    <ul className="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {files.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white px-2.5 py-1.5 text-[11px] text-slate-700 shadow-sm ring-1 ring-slate-100"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-primary" />
                            <span className="truncate">{item.file.name}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(item.id)}
                            className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Remove file"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      onClick={() =>
                        navigate('/sign-pdf-online/signer', {
                          state: { files: files.map((f) => f.file) },
                        })
                      }
                      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      disabled={files.length === 0}
                    >
                      Continue to mark signers
                    </button>
                  </div>
                )}

                {/* Footer helper text */}
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                  <HelpCircle className="mt-[2px] h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                  <p>
                    We generate a fresh, cryptographically signed PDF for every completed session.
                    All signers receive an original copy with a built‑in audit summary.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16 p-8 bg-gray-100">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mt-4 partial-heading text-2xl font-bold text-slate-900 sm:text-3xl">
              From upload to signed envelops in one guided flow
            </h2>
            <p className="mt-3 details-text text-sm text-slate-600">
              No tokens, drivers, or desktop apps. Just your document and the signer&apos;s
              Aadhaar‑linked mobile number.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="bg-white h-[250px] rounded-md relative flex flex-col gap-3 p-4">
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                <img src="/videos/gif/upload.png" alt="upload" className="h-20 w-20" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 price-heading">Upload & place fields</h3>
              <p className="details-text">
                Add PDFs or images, then mark where each signer should sign, fill details, or add
                dates.
              </p>
            </div>
            <div className="bg-white rounded-md relative flex flex-col gap-3 p-4">
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                <img src="/videos/gif/link.png" alt="upload" className="h-20 w-20" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 price-heading">
                Share secure signing links
              </h3>
              <p className="details-text">
                Send private links over WhatsApp, SMS, or email. Each signer sees only what they
                need.
              </p>
            </div>
            <div className="bg-white rounded-md relative flex flex-col gap-3 p-4">
              <span className="inline-flex items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                <img src="/videos/gif/verify.png" alt="upload" className="h-20 w-20" />
              </span>
              <h3 className="text-sm font-semibold text-slate-900 price-heading">
                Sign with Aadhaar OTP & verify
              </h3>
              <p className="details-text">
                Aadhaar‑linked OTP completes the signature. A QR‑enabled certificate keeps the
                document court‑ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Aadhaar eSign with Draft & Sign */}
      <section className="mt-16">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr] lg:items-center">
            <div>
              <h2 className="heading text-center">
                Built for serious, Aadhaar backed agreements
              </h2>
              <p className="details-text max-w-2xl mx-auto text-center">
                {APP_NAME} Sign pairs bank grade security with an intuitive signing flow, so your
                teams can move faster without compromising on compliance.
              </p>

              <div className="mt-5 max-w-5xl mx-auto grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-100 flex flex-col items-center text-center">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <ShieldCheck className="h-10 w-10" />
                  </div>

                  <h3 className="mt-3 price-heading text-sm font-semibold text-slate-900">
                    Secure & Trusted Signing
                  </h3>

                  <p className="details-text">
                    Sign documents digitally with strong identity checks, audit trails, and secure workflows
                    designed for business use in India.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-100 flex flex-col items-center text-center">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Users className="h-10 w-10" />
                  </div>
                  <h3 className="mt-3 price-heading text-sm font-semibold text-slate-900">
                    Multi-party, from anywhere
                  </h3>

                  <p className="details-text">
                    Invite multiple signers, define signing order, and complete agreements from any device,
                    anywhere.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-100 flex flex-col items-center text-center">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <FileText className="h-10 w-10" />
                  </div>

                  <h3 className="mt-3 price-heading text-sm font-semibold text-slate-900">
                    Tamper-proof Documents
                  </h3>

                  <p className="details-text">
                    Protect signed files with cryptographic security to ensure documents remain unchanged
                    after signing.
                  </p>
                </div>
                <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-100 flex flex-col items-center text-center">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <Verified className="h-10 w-10" />
                  </div>

                  <h3 className="mt-3 price-heading text-sm font-semibold text-slate-900">
                    Instant Verification
                  </h3>

                  <p className="details-text">
                     Instantly verify signed documents using built-in QR codes and trusted PDF readers.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-100 flex flex-col items-center text-center">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <UserCheck  className="h-10 w-10" />
                  </div>
                  <h3 className="mt-3 price-heading text-sm font-semibold text-slate-900">
                      Smart Identity Proof
                  </h3>

                  <p className="details-text">
                     Capture live photos, video, and activity logs to build strong signing evidence and trust.
                  </p>
                </div>

                <div className="rounded-xl bg-white p-8 shadow-sm ring-1 ring-slate-100 flex flex-col items-center text-center">
                  <div className="flex h-15 w-15 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                    <FileCheck className="h-10 w-10" />
                  </div>

                  <h3 className="mt-3 price-heading text-sm font-semibold text-slate-900">
                    Original Signed Copies
                  </h3>

                  <p className="details-text">
                     Each signer automatically receives a secure, original copy for their records.
                  </p>
                </div>
              </div>
            </div>          
          </div>
        </div>
      </section>

      {/* FAQ — scenario-based accordion with toggle face */}
      <section className="mt-16 bg-slate-50 p-8 ">
        <div className="container-max px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold text-slate-900 sm:text-3xl">
              Common questions
            </h2>
            <p className="mt-2 text-center text-sm text-slate-500">
              Expand any question below for a quick answer. Each is grouped by when it matters.
            </p>

            <div className="mt-8 space-y-2">
              {FAQ_ITEMS.map((item) => {
                const style = SCENARIO_STYLE[item.scenario];
                const isOpen = openFaqId === item.id;
                const borderColor =
                  style.accent === 'emerald'
                    ? 'border-l-emerald-500'
                    : style.accent === 'blue'
                      ? 'border-l-blue-500'
                      : style.accent === 'amber'
                        ? 'border-l-amber-500'
                        : style.accent === 'violet'
                          ? 'border-l-violet-500'
                          : 'border-l-rose-500';
                const bgOpen =
                  style.accent === 'emerald'
                    ? 'bg-emerald-50/50'
                    : style.accent === 'blue'
                      ? 'bg-sky-50/50'
                      : style.accent === 'amber'
                        ? 'bg-amber-50/50'
                        : style.accent === 'violet'
                          ? 'bg-violet-50/50'
                          : 'bg-rose-50/50';

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border border-slate-200 bg-white shadow-sm transition ${isOpen ? 'ring-1 ring-slate-200 ' + bgOpen : ''}`}
                  >
                    <div
                      className={`border-l-4 ${borderColor} rounded-r-xl ${isOpen ? 'rounded-tr-xl' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                        className="flex w-full cursor-pointer items-start justify-between gap-3 px-4 py-3.5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className="flex min-w-0 flex-1 items-start gap-3">
                          <span
                            className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md ${
                              style.accent === 'emerald'
                                ? 'bg-emerald-100 text-emerald-700'
                                : style.accent === 'blue'
                                  ? 'bg-sky-100 text-sky-700'
                                  : style.accent === 'amber'
                                    ? 'bg-amber-100 text-amber-700'
                                    : style.accent === 'violet'
                                      ? 'bg-violet-100 text-violet-700'
                                      : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {style.icon}
                          </span>
                          <span className="text-sm font-semibold text-slate-900">
                            {item.question}
                          </span>
                        </span>
                        <span
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
                          aria-hidden
                        >
                          {isOpen ? (
                            <Minus className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </span>
                      </button>
                      <div
                        className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                      >
                        <div className="overflow-hidden">
                          <div className="border-t border-slate-100 px-4 pb-4 pt-2 pl-[3.25rem]">
                            <p className="text-sm text-slate-600">{item.answer}</p>
                            <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                              {style.label}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      <DigitaCertificate />
    </div>
  );
};

export default UploadDocumentPage;

