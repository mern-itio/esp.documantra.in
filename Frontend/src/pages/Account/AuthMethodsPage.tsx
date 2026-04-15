import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../services/apiHelper';
import { ArrowLeft, Mail, Phone, ShieldCheck, KeyRound, Smartphone, Loader2, Copy, CheckCircle2, QrCode, HelpCircle, X, Edit, Plus } from 'lucide-react';

type AuthMethod = 'email' | 'sms' | 'authenticator';
type RecoveryQuestionTab = 'prebuilt' | 'custom';

const PREBUILT_RECOVERY_QUESTIONS = [
  'What is your school name?',
  'What is your first pet name?',
  'What is your mother name?',
];

interface TwoFaState {
  enabled: boolean;
  method: AuthMethod;
  authenticatorConfigured: boolean;
  backupCodesRemaining: number;
  recoveryEmail: string;
  recoveryQuestions: string[];
}

interface AuthenticatorSetupState {
  open: boolean;
  loading: boolean;
  qrCodeUrl: string;
  manualEntryKey: string;
  verifyCode: string;
  verifying: boolean;
  copied: boolean;
}

const AuthMethodsPage: React.FC = () => {
  const navigate = useNavigate();

  const [twoFa, setTwoFa] = useState<TwoFaState>({
    enabled: false,
    method: 'email',
    authenticatorConfigured: false,
    backupCodesRemaining: 0,
    recoveryEmail: '',
    recoveryQuestions: ['', '', ''],
  });
  const [recoveryAnswers, setRecoveryAnswers] = useState<string[]>(['', '', '']);
  const [recoveryQuestionsLocked, setRecoveryQuestionsLocked] = useState(false);
  const [recoveryQuestionTab, setRecoveryQuestionTab] = useState<RecoveryQuestionTab>('prebuilt');
  const [recoveryPrebuiltSelection, setRecoveryPrebuiltSelection] = useState<string[]>([
    PREBUILT_RECOVERY_QUESTIONS[0],
    PREBUILT_RECOVERY_QUESTIONS[1],
    PREBUILT_RECOVERY_QUESTIONS[2],
  ]);
  const [recoveryEmailVerified, setRecoveryEmailVerified] = useState(false);
  const [pendingRecoveryEmailMasked, setPendingRecoveryEmailMasked] = useState('');
  const [recoveryEmailOtp, setRecoveryEmailOtp] = useState('');
  const [otpSentForRecoveryEmail, setOtpSentForRecoveryEmail] = useState(false);
  const [isEditingRecoveryEmail, setIsEditingRecoveryEmail] = useState(false);
  const [sendingRecoveryOtp, setSendingRecoveryOtp] = useState(false);
  const [verifyingRecoveryOtp, setVerifyingRecoveryOtp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [authenticatorSetup, setAuthenticatorSetup] = useState<AuthenticatorSetupState>({
    open: false,
    loading: false,
    qrCodeUrl: '',
    manualEntryKey: '',
    verifyCode: '',
    verifying: false,
    copied: false
  });
  /** Plain backup codes shown once after verify or regenerate */
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[] | null>(null);
  const [backupCodesCopied, setBackupCodesCopied] = useState(false);
  const [regenerateCode, setRegenerateCode] = useState('');
  const [regenerating, setRegenerating] = useState(false);
  const [showAuthenticatorResetFlow, setShowAuthenticatorResetFlow] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);
  const [tourTargetRect, setTourTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const resp = await authApi.get('/api/auth/2fa');
        const enabled = !!resp.data?.twoFaEnabled;
        const method: AuthMethod = resp.data?.twoFaMethod === 'sms'
          ? 'sms'
          : (resp.data?.twoFaMethod === 'authenticator' ? 'authenticator' : 'email');
        const authenticatorConfigured = !!resp.data?.authenticatorConfigured || method === 'authenticator';
        const backupCodesRemaining =
          typeof resp.data?.backupCodesRemaining === 'number' ? resp.data.backupCodesRemaining : 0;
        const recoveryQuestions = Array.isArray(resp.data?.recoveryQuestions) && resp.data.recoveryQuestions.length > 0
          ? resp.data.recoveryQuestions.slice(0, 3)
          : ['', '', ''];
        const hasCustomQuestion = recoveryQuestions.some(
          (q: string) => !PREBUILT_RECOVERY_QUESTIONS.includes(String(q || '').trim())
        );
        const nextSelections = recoveryQuestions.map((q: string, idx: number) =>
          PREBUILT_RECOVERY_QUESTIONS.includes(String(q || '').trim())
            ? String(q || '').trim()
            : PREBUILT_RECOVERY_QUESTIONS[idx] || PREBUILT_RECOVERY_QUESTIONS[0]
        );
        setTwoFa({
          enabled,
          method,
          authenticatorConfigured,
          backupCodesRemaining,
          recoveryEmail: String(resp.data?.recoveryEmail || ''),
          recoveryQuestions,
        });
        setRecoveryEmailVerified(!!resp.data?.recoveryEmailVerified);
        setPendingRecoveryEmailMasked(String(resp.data?.pendingRecoveryEmailMasked || ''));
        setOtpSentForRecoveryEmail(!!resp.data?.pendingRecoveryEmailMasked);
        setIsEditingRecoveryEmail(!resp.data?.recoveryEmail);
        setRecoveryQuestionsLocked(!!resp.data?.recoveryQuestionsLocked || (recoveryQuestions.filter(Boolean).length >= 3));
        setRecoveryQuestionTab(hasCustomQuestion ? 'custom' : 'prebuilt');
        setRecoveryPrebuiltSelection([
          nextSelections[0] || PREBUILT_RECOVERY_QUESTIONS[0],
          nextSelections[1] || PREBUILT_RECOVERY_QUESTIONS[1],
          nextSelections[2] || PREBUILT_RECOVERY_QUESTIONS[2],
        ]);
        setRecoveryAnswers(['', '', '']);
        if (authenticatorConfigured) {
          setShowAuthenticatorResetFlow(false);
        }
      } catch (e: unknown) {
        // If backend is not available, keep defaults but show a soft error
        const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
        setError(apiError || 'Unable to load current authentication settings.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!twoFa.enabled) {
      setError('Enable 2FA to use the verification method.');
      setMessage('');
      return;
    }

    if (twoFa.method === 'authenticator' && !twoFa.authenticatorConfigured) {
      setError('Set up and verify the authenticator app first, then save.');
      setMessage('');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const resolvedRecoveryQuestions = twoFa.recoveryQuestions.map((question, idx) => {
        if (recoveryQuestionTab === 'prebuilt') {
          return recoveryPrebuiltSelection[idx] || PREBUILT_RECOVERY_QUESTIONS[idx] || '';
        }
        return question;
      });
      const resp = await authApi.post('/api/auth/2fa', {
        enabled: twoFa.enabled,
        method: twoFa.method,
        recoveryQuestions: resolvedRecoveryQuestions
          .map((question, idx) => ({
            question: String(question || '').trim(),
            answer: String(recoveryAnswers[idx] || '').trim(),
          }))
          .filter((item) => item.question && item.answer)
      });
      const enabled = !!resp.data?.twoFaEnabled;
      const method: AuthMethod = resp.data?.twoFaMethod === 'sms'
        ? 'sms'
        : (resp.data?.twoFaMethod === 'authenticator' ? 'authenticator' : 'email');
      setTwoFa((prev) => ({
        ...prev,
        enabled,
        method,
        recoveryEmail: String(resp.data?.recoveryEmail || prev.recoveryEmail),
        recoveryQuestions: resolvedRecoveryQuestions.map((q) => String(q || '').trim()),
      }));
      setRecoveryEmailVerified(!!resp.data?.recoveryEmailVerified);
      setPendingRecoveryEmailMasked(String(resp.data?.pendingRecoveryEmailMasked || ''));
      setOtpSentForRecoveryEmail(!!resp.data?.pendingRecoveryEmailMasked);
      setRecoveryQuestionsLocked(
        !!resp.data?.recoveryQuestionsLocked
        || resolvedRecoveryQuestions.filter((q) => String(q || '').trim().length > 0).length >= 3
      );
      setMessage('Authentication method updated successfully.');
    } catch (e: unknown) {
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Failed to update authentication method.');
    } finally {
      setSaving(false);
    }
  };

  const sendRecoveryEmailVerificationOtp = async () => {
    if (!twoFa.recoveryEmail.trim()) {
      setError('Enter recovery email first.');
      return;
    }
    setError('');
    setMessage('');
    setSendingRecoveryOtp(true);
    try {
      const resp = await authApi.post('/api/auth/2fa/recovery-email/send-otp', {
        recoveryEmail: twoFa.recoveryEmail.trim().toLowerCase(),
      });
      setPendingRecoveryEmailMasked(String(resp.data?.pendingRecoveryEmailMasked || ''));
      setRecoveryEmailVerified(false);
      setOtpSentForRecoveryEmail(true);
      setMessage(resp.data?.message || 'OTP sent to recovery email.');
    } catch (e: unknown) {
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Failed to send recovery email OTP.');
    } finally {
      setSendingRecoveryOtp(false);
    }
  };

  const verifyRecoveryEmailOtpCode = async () => {
    if (recoveryEmailOtp.trim().length !== 6) {
      setError('Enter the 6-digit OTP.');
      return;
    }
    setError('');
    setMessage('');
    setVerifyingRecoveryOtp(true);
    try {
      const resp = await authApi.post('/api/auth/2fa/recovery-email/verify-otp', {
        otp: recoveryEmailOtp.trim(),
      });
      setRecoveryEmailVerified(!!resp.data?.recoveryEmailVerified);
      setTwoFa((prev) => ({
        ...prev,
        recoveryEmail: String(resp.data?.recoveryEmail || prev.recoveryEmail),
      }));
      setPendingRecoveryEmailMasked('');
      setRecoveryEmailOtp('');
      setOtpSentForRecoveryEmail(false);
      setIsEditingRecoveryEmail(false);
      setMessage(resp.data?.message || 'Recovery email verified.');
    } catch (e: unknown) {
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Failed to verify OTP.');
    } finally {
      setVerifyingRecoveryOtp(false);
    }
  };

  const startAuthenticatorSetup = async () => {
    setError('');
    setMessage('');
    setShowAuthenticatorResetFlow(true);
    setAuthenticatorSetup((prev) => ({
      ...prev,
      open: true,
      loading: true,
      copied: false,
      verifyCode: ''
    }));

    try {
      const resp = await authApi.get('/api/auth/2fa/authenticator/setup');
      setTwoFa((prev) => ({ ...prev, method: 'authenticator' }));
      setAuthenticatorSetup((prev) => ({
        ...prev,
        loading: false,
        qrCodeUrl: resp.data?.qrCodeUrl || '',
        manualEntryKey: resp.data?.manualEntryKey || '',
      }));
    } catch (e: unknown) {
      setAuthenticatorSetup((prev) => ({ ...prev, loading: false }));
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Unable to start authenticator setup right now.');
    }
  };

  const copyAllBackupCodes = async () => {
    if (!pendingBackupCodes?.length) return;
    try {
      const plainCodes = pendingBackupCodes
        .map((code) => code.replace(/\D/g, ''))
        .filter(Boolean);
      await navigator.clipboard.writeText(plainCodes.join('\n'));
      setBackupCodesCopied(true);
      window.setTimeout(() => setBackupCodesCopied(false), 2000);
    } catch {
      setError('Could not copy backup codes. Copy them manually.');
    }
  };

  const regenerateBackupCodes = async () => {
    if (regenerateCode.replace(/\D/g, '').length !== 6) {
      setError('Enter your current 6-digit authenticator code to generate new backup codes.');
      return;
    }
    setError('');
    setMessage('');
    setRegenerating(true);
    try {
      const resp = await authApi.post('/api/auth/2fa/authenticator/regenerate-backup-codes', {
        code: regenerateCode.replace(/\D/g, '').slice(0, 6),
      });
      const remaining =
        typeof resp.data?.backupCodesRemaining === 'number' ? resp.data.backupCodesRemaining : 10;
      setTwoFa((prev) => ({ ...prev, backupCodesRemaining: remaining }));
      if (Array.isArray(resp.data?.backupCodes) && resp.data.backupCodes.length > 0) {
        setPendingBackupCodes(resp.data.backupCodes as string[]);
        setBackupCodesCopied(false);
      }
      setRegenerateCode('');
      setMessage(resp.data?.message || 'New backup codes generated. Save them in a safe place.');
    } catch (e: unknown) {
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Could not regenerate backup codes.');
    } finally {
      setRegenerating(false);
    }
  };

  const copySetupKey = async () => {
    if (!authenticatorSetup.manualEntryKey) return;
    try {
      await navigator.clipboard.writeText(authenticatorSetup.manualEntryKey);
      setAuthenticatorSetup((prev) => ({ ...prev, copied: true }));
      window.setTimeout(() => setAuthenticatorSetup((prev) => ({ ...prev, copied: false })), 1400);
    } catch {
      setError('Copy failed. Please select and copy the setup key manually.');
    }
  };

  const verifyAuthenticatorSetup = async () => {
    if (!authenticatorSetup.verifyCode.trim()) {
      setError('Enter the 6-digit code shown in your authenticator app.');
      return;
    }
    setError('');
    setMessage('');
    setAuthenticatorSetup((prev) => ({ ...prev, verifying: true }));
    try {
      const resp = await authApi.post('/api/auth/2fa/authenticator/verify-setup', {
        code: authenticatorSetup.verifyCode
      });
      const remaining =
        typeof resp.data?.backupCodesRemaining === 'number' ? resp.data.backupCodesRemaining : 10;
      setTwoFa((prev) => ({
        ...prev,
        method: 'authenticator',
        enabled: !!resp.data?.twoFaEnabled,
        authenticatorConfigured: true,
        backupCodesRemaining: remaining,
      }));
      if (Array.isArray(resp.data?.backupCodes) && resp.data.backupCodes.length > 0) {
        setPendingBackupCodes(resp.data.backupCodes as string[]);
        setBackupCodesCopied(false);
      }
      setShowAuthenticatorResetFlow(false);
      setAuthenticatorSetup((prev) => ({ ...prev, verifying: false, verifyCode: '' }));
      setMessage(
        'Authenticator app is now active. Save your backup codes below — they are shown only once and work if you lose your phone.'
      );
    } catch (e: unknown) {
      setAuthenticatorSetup((prev) => ({ ...prev, verifying: false }));
      const apiError = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(apiError || 'Could not verify your code. Please try again.');
    }
  };

  const tourSteps = [
    {
      title: 'Choose the strongest method',
      description:
        'Select "Authenticator app" for the most secure login experience. It works offline and is harder to intercept than SMS.',
      actionLabel: 'Select authenticator method',
      action: () => {
        setTwoFa((prev) => ({ ...prev, method: 'authenticator' }));
      },
    },
    {
      title: 'Generate your setup QR',
      description:
        'Tap Generate new QR code. Then scan it in Google Authenticator, Microsoft Authenticator, or Authy. Use manual key if scan fails.',
      actionLabel: 'Generate QR now',
      action: () => startAuthenticatorSetup(),
    },
    {
      title: 'Verify with 6-digit app code',
      description:
        'Type the current 6-digit code from your app and verify. If it fails, wait for the next code and ensure phone time is automatic.',
      actionLabel: 'Go to verification step',
      action: () => {
        setTwoFa((prev) => ({ ...prev, method: 'authenticator' }));
        setShowAuthenticatorResetFlow(true);
      },
    },
    {
      title: 'Save backup codes safely',
      description:
        'After verification, copy backup codes and store them in a password manager. Each code is one-time use for recovery.',
      actionLabel: 'Open backup section',
      action: () => {
        setTwoFa((prev) => ({ ...prev, method: 'authenticator' }));
        setShowAuthenticatorResetFlow(true);
      },
    },
  ];

  const getTourSelector = (stepIndex: number) => {
    const selectors = [
      '[data-tour="auth-method-authenticator"]',
      '[data-tour="auth-generate-qr"]',
      '[data-tour="auth-verify-section"]',
      '[data-tour="auth-backup-section"]',
    ];
    return selectors[stepIndex] || selectors[0];
  };

  const updateTourTargetRect = useCallback((stepIndex: number) => {
    const selector = getTourSelector(stepIndex);
    const target = document.querySelector(selector) as HTMLElement | null;
    if (!target) return;
    const rect = target.getBoundingClientRect();
    setTourTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });
  }, []);

  const scrollToTourTarget = (stepIndex: number) => {
    const selector = getTourSelector(stepIndex);
    if (!selector) return;
    const target = document.querySelector(selector) as HTMLElement | null;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const runTourStepAction = () => {
    const step = tourSteps[tourStepIndex];
    if (step?.action) {
      step.action();
      window.setTimeout(() => scrollToTourTarget(tourStepIndex), 450);
    }
  };

  useEffect(() => {
    if (!isTourOpen) return;
    const t = window.setTimeout(() => {
      scrollToTourTarget(tourStepIndex);
      window.setTimeout(() => updateTourTargetRect(tourStepIndex), 350);
    }, 200);
    return () => window.clearTimeout(t);
  }, [isTourOpen, tourStepIndex, updateTourTargetRect]);

  useEffect(() => {
    if (!isTourOpen) return;

    // Keep the user in authenticator context during tour.
    setTwoFa((prev) => (prev.method === 'authenticator' ? prev : { ...prev, method: 'authenticator' }));

    // From step 2 onward, show a scaffold setup UI even before QR is generated,
    // so tour never gets "stuck" on missing targets.
    if (tourStepIndex >= 1 && !showAuthenticatorResetFlow) {
      setShowAuthenticatorResetFlow(true);
    }
    if (tourStepIndex >= 1 && !authenticatorSetup.open) {
      setAuthenticatorSetup((prev) => ({ ...prev, open: true }));
    }
  }, [isTourOpen, tourStepIndex, showAuthenticatorResetFlow, authenticatorSetup.open]);

  useEffect(() => {
    if (!isTourOpen) return;
    const onViewportChange = () => updateTourTargetRect(tourStepIndex);
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
    const timer = window.setInterval(onViewportChange, 300);
    return () => {
      window.removeEventListener('scroll', onViewportChange, true);
      window.removeEventListener('resize', onViewportChange);
      window.clearInterval(timer);
    };
  }, [isTourOpen, tourStepIndex, updateTourTargetRect]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr),320px]">
          <section className="space-y-6">
            <div className="overflow-hidden border border-border/70 bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/70 bg-gradient-to-r from-card to-primary/10 px-5 py-4 md:px-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/account/profile')}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background/80 text-foreground hover:bg-muted"
                    aria-label="Back to profile"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2"> 
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Account Security
                    </p>
                    <span
                    className={`inline-flex items-center gap-2 rounded-full border px-2 py-1 text-[9px] font-semibold ${twoFa.enabled
                        ? 'border-success/35 bg-success/10 text-success'
                        : 'border-border bg-muted/60 text-muted-foreground'
                      }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${twoFa.enabled ? 'bg-success' : 'bg-muted-foreground'}`}
                    />
                    {twoFa.enabled ? 'MFA Enabled' : 'MFA Disabled'}
                  </span>
                    </div>
                   
                    <h1 className="text-xl font-semibold text-foreground md:text-2xl">
                      Multi-factor authentication
                    </h1>
                    <p className="mt-1 text-xs text-muted-foreground md:text-sm">
                      Configure a secure second step for sign-in and recovery.
                    </p>
                    
                  </div>
                </div>
                <div className="flex items-center gap-2">
                <button
                      type="button"
                      onClick={() => setTwoFa((prev) => ({ ...prev, enabled: !prev.enabled }))}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition ${twoFa.enabled ? 'bg-primary' : 'bg-muted'
                        }`}
                      aria-label="Toggle multi-factor authentication"
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-background shadow transition ${twoFa.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                      />
                    </button>
                
                </div>
              </div>

              <div className="grid gap-3 px-5 py-5 md:grid-cols-3 md:px-6">
                <button
                  type="button"
                  onClick={() => setTwoFa((prev) => ({ ...prev, method: 'email' }))}
                  className={`group rounded-lg border p-4 text-left transition ${twoFa.method === 'email'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border/80 bg-background hover:border-primary/40 hover:bg-muted/40'
                    }`}
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">Email code</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Receive a one-time verification code in your email.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTwoFa((prev) => ({ ...prev, method: 'sms' }))}
                  className={`group rounded-lg border p-4 text-left transition ${twoFa.method === 'sms'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border/80 bg-background hover:border-primary/40 hover:bg-muted/40'
                    }`}
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">SMS OTP</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Get a secure code on your registered mobile number.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTwoFa((prev) => ({ ...prev, method: 'authenticator' }));
                    if (twoFa.authenticatorConfigured) {
                      setShowAuthenticatorResetFlow(false);
                    } else if (!authenticatorSetup.open) {
                      startAuthenticatorSetup();
                    }
                  }}
                  className={`group rounded-lg border p-4 text-left transition ${twoFa.method === 'authenticator'
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/30'
                      : 'border-border/80 bg-background hover:border-primary/40 hover:bg-muted/40'
                    }`}
                  data-tour="auth-method-authenticator"
                >
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Smartphone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">Authenticator app</p>
                
                <button
                  type="button"
                  onClick={() => {
                    setTourStepIndex(0);
                    setTourTargetRect(null);
                    setIsTourOpen(true);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  <HelpCircle className="h-4 w-4" />
                
                </button>
                  </div>
                  
                  <p className="mt-1 text-xs text-muted-foreground">
                    Best security with app-generated time-based codes.
                  </p>
                  <p className="mt-2 text-[11px] font-medium text-primary">
                    {twoFa.authenticatorConfigured ? 'Configured' : 'Setup required'}
                  </p>
                </button>
              </div>
            </div>

            {(error || message) && (
              <div
                className={`rounded-lg border px-4 py-3 text-sm ${error
                    ? 'border-destructive/40 bg-destructive/10 text-destructive'
                    : 'border-success/40 bg-success/10 text-success'
                  }`}
              >
                {error || message}
              </div>
            )}

            {loading ? (
              <div className="rounded-2xl border border-border bg-card px-5 py-8 text-sm text-muted-foreground">
                Loading your current authentication settings...
              </div>
            ) : (
              <>
                <div className=" border border-border bg-card p-5 md:p-6">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Protection status</p>
                      <p className="text-xs text-muted-foreground">
                        Enable MFA so every new device requires a second verification step.
                      </p>
                    </div>
                  </div>

                  {twoFa.method === 'authenticator' && twoFa.authenticatorConfigured && !showAuthenticatorResetFlow && (
                    <div className="space-y-3 border border-border bg-muted/20 p-4 md:p-5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Authenticator app is configured</p>
                        <p className="text-xs text-muted-foreground">
                          To reconfigure this setup, generate a new QR code and follow setup again.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={startAuthenticatorSetup}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                          data-tour="auth-generate-qr"
                        >
                          Generate new QR code
                        </button>
                      </div>
                    </div>
                  )}

                  {twoFa.method === 'authenticator' && (!twoFa.authenticatorConfigured || showAuthenticatorResetFlow) && (
                    <div className="space-y-4 border border-border bg-muted/30 p-4 md:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">Authenticator workspace</p>
                          <p className="text-xs text-muted-foreground">
                            Scan QR, verify a live code, then store backup codes securely.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={startAuthenticatorSetup}
                          className="rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                          data-tour="auth-generate-qr"
                        >
                          Generate new QR code
                        </button>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-[240px,minmax(0,1fr)]">
                        <div className="flex items-center justify-center rounded-xl border border-border bg-background p-4">
                          {authenticatorSetup.loading ? (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Preparing QR...
                            </div>
                          ) : authenticatorSetup.qrCodeUrl ? (
                            <img
                              src={authenticatorSetup.qrCodeUrl}
                              alt="Authenticator QR code"
                              className="h-52 w-52 rounded-lg border border-border/70 bg-white p-2"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <QrCode className="h-8 w-8" />
                              <span className="text-xs">QR code appears here</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Manual setup key
                            </p>
                            <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                              <code className="flex-1 truncate font-mono text-[11px] text-foreground">
                                {authenticatorSetup.manualEntryKey || 'Generate setup key first'}
                              </code>
                              <button
                                type="button"
                                onClick={copySetupKey}
                                disabled={!authenticatorSetup.manualEntryKey}
                                className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium hover:bg-muted disabled:opacity-50"
                              >
                                {authenticatorSetup.copied ? (
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                                {authenticatorSetup.copied ? 'Copied' : 'Copy'}
                              </button>
                            </div>
                          </div>

                          <div data-tour="auth-verify-section">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              Verify setup
                            </p>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={authenticatorSetup.verifyCode}
                                onChange={(e) =>
                                  setAuthenticatorSetup((prev) => ({
                                    ...prev,
                                    verifyCode: e.target.value.replace(/\D/g, '').slice(0, 6),
                                  }))
                                }
                                className="h-10 w-44 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                placeholder="Enter 6-digit code"
                              />
                              <button
                                type="button"
                                onClick={verifyAuthenticatorSetup}
                                disabled={authenticatorSetup.verifying || authenticatorSetup.verifyCode.length !== 6}
                                className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                              >
                                {authenticatorSetup.verifying ? 'Verifying...' : 'Verify & Enable'}
                              </button>
                            </div>
                            <p className="mt-2 text-[11px] text-muted-foreground">
                              Keep your setup key secure. It can restore app access if you change devices.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {showAuthenticatorResetFlow && pendingBackupCodes && pendingBackupCodes.length > 0 && (
                    <div className="mt-4 rounded-xl border border-amber-500/60 bg-card p-4 text-foreground " data-tour="auth-backup-section">
                      <div className="flex items-start gap-2">
                        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-foreground">
                            Backup codes - visible once
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Store these in a password manager. Each code is single-use.
                          </p>
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {pendingBackupCodes.map((c, i) => (
                              <div
                                key={`${c}-${i}`}
                                className="rounded-lg border border-border bg-background px-2 py-2 text-center font-mono text-[11px] font-semibold text-foreground"
                              >
                                {c}
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={copyAllBackupCodes}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              {backupCodesCopied ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                              {backupCodesCopied ? 'Copied all' : 'Copy all'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingBackupCodes(null)}
                              className="text-xs font-semibold text-foreground underline underline-offset-2 hover:text-foreground"
                            >
                              I stored these safely
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {isTourOpen &&
                    tourStepIndex === 3 &&
                    (!pendingBackupCodes || pendingBackupCodes.length === 0) &&
                    (
                      <div className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4" data-tour="auth-backup-section">
                        <p className="text-sm font-semibold text-foreground">Backup codes</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          After verification, this section will show your one-time backup codes with copy actions.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {['1234-5678', '2234-6678', '3234-7678', '4234-8678', '5234-9678', '6234-1078'].map((code) => (
                            <div key={code} className="rounded-lg border border-border bg-background px-2 py-2 text-center font-mono text-[11px] text-muted-foreground">
                              {code}
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-[11px] text-muted-foreground">
                          This is a preview for the tour. Real backup codes appear only after successful verification.
                        </p>
                      </div>
                    )}

                  {twoFa.method === 'authenticator' && twoFa.authenticatorConfigured && showAuthenticatorResetFlow && (
                    <div className="mt-4 rounded-xl border border-border bg-background p-4" data-tour="auth-backup-section">
                      <p className="text-sm font-semibold text-foreground">Backup code management</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Remaining one-time codes: <span className="font-semibold tabular-nums">{twoFa.backupCodesRemaining}</span>
                      </p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={regenerateCode}
                          onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="h-10 w-44 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                          placeholder="Current app code"
                          aria-label="Current authenticator code"
                        />
                        <button
                          type="button"
                          onClick={regenerateBackupCodes}
                          disabled={regenerating || regenerateCode.length !== 6}
                          className="inline-flex h-10 items-center rounded-lg border border-border bg-card px-4 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                        >
                          {regenerating ? 'Generating...' : 'Regenerate backup codes'}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">2FA recovery setup</p>
                      {recoveryQuestionsLocked && (
                        <span className="rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                          Questionnaires added
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      If you lose access to your authenticator device, we will ask these security questions and then send an OTP to selected email.
                    </p>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Recovery email
                        </label>
                        {!isEditingRecoveryEmail ? (
                          <div className="w-100 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2.5">
                            <span className="text-sm text-foreground">
                              {twoFa.recoveryEmail || 'No recovery email added'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsEditingRecoveryEmail(true);
                                setOtpSentForRecoveryEmail(false);
                                setRecoveryEmailOtp('');
                                setPendingRecoveryEmailMasked('');
                                setRecoveryEmailVerified(false);
                              }}
                              className="text-xs font-semibold text-foreground hover:bg-muted"
                            >
                              {twoFa.recoveryEmail ? <Edit size={16} /> : <Plus size={16} />}
                            </button>
                          </div>
                        ) : (
                          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr),auto,auto]">
                            <input
                              type="email"
                              value={twoFa.recoveryEmail}
                              onChange={(e) => {
                                const value = e.target.value.trim();
                                setTwoFa((prev) => ({ ...prev, recoveryEmail: value }));
                                setRecoveryEmailVerified(false);
                              }}
                              className="h-10 w-100 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                              placeholder="recovery@example.com"
                            />
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={sendRecoveryEmailVerificationOtp}
                                disabled={sendingRecoveryOtp || !twoFa.recoveryEmail.trim()}
                                className="h-10 rounded-lg border border-border bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                              >
                                {sendingRecoveryOtp ? 'Sending...' : 'Send OTP'}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditingRecoveryEmail(false);
                                  setOtpSentForRecoveryEmail(false);
                                  setRecoveryEmailOtp('');
                                  setPendingRecoveryEmailMasked('');
                                }}
                                className="h-10 rounded-lg border border-border px-3 text-xs font-semibold text-foreground hover:bg-muted"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {isEditingRecoveryEmail && otpSentForRecoveryEmail && (
                          <div className="mt-2 grid gap-2 md:grid-cols-[minmax(0,1fr),auto]">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={6}
                              value={recoveryEmailOtp}
                              onChange={(e) => setRecoveryEmailOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                              className="h-10 w-100 rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                              placeholder={`Enter OTP sent to ${pendingRecoveryEmailMasked || 'recovery email'}`}
                            />
                            <button
                              type="button"
                              onClick={verifyRecoveryEmailOtpCode}
                              disabled={verifyingRecoveryOtp || recoveryEmailOtp.length !== 6}
                              className="h-10 w-40 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                            >
                              {verifyingRecoveryOtp ? 'Verifying...' : 'Verify OTP'}
                            </button>
                          </div>
                        )}
                        <p className={`mt-2 text-[11px] ${recoveryEmailVerified ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {recoveryEmailVerified ? 'Recovery email verified.' : 'Recovery email must be OTP-verified before enabling 2FA.'}
                        </p>
                      </div>
                      {recoveryQuestionsLocked ? (
                        null
                      ) : (
                        <>
                          <div className="inline-flex rounded-lg border border-border bg-muted/20 p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setRecoveryQuestionTab('prebuilt');
                                setTwoFa((prev) => ({
                                  ...prev,
                                  recoveryQuestions: recoveryPrebuiltSelection.map(
                                    (q, idx) => q || PREBUILT_RECOVERY_QUESTIONS[idx] || ''
                                  ),
                                }));
                              }}
                              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${recoveryQuestionTab === 'prebuilt'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                              Prebuilt Questions
                            </button>
                            <button
                              type="button"
                              onClick={() => setRecoveryQuestionTab('custom')}
                              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${recoveryQuestionTab === 'custom'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground'
                                }`}
                            >
                              Custom Questions
                            </button>
                          </div>

                          <div className="space-y-2 rounded-lg border border-border/70 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {recoveryQuestionTab === 'prebuilt'
                                ? 'Select 3 Prebuilt Questions And Add Answers'
                                : 'Create 3 Custom Questions And Add Answers'}
                            </p>
                            {[0, 1, 2].map((idx) => (
                              <div key={idx} className="grid gap-2 md:grid-cols-2">
                                {recoveryQuestionTab === 'prebuilt' ? (
                                  <select
                                    value={recoveryPrebuiltSelection[idx] || PREBUILT_RECOVERY_QUESTIONS[idx] || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setRecoveryPrebuiltSelection((prev) => {
                                        const next = [...prev];
                                        next[idx] = value;
                                        return next;
                                      });
                                      setTwoFa((prev) => {
                                        const nextQuestions = [...prev.recoveryQuestions];
                                        nextQuestions[idx] = value;
                                        return { ...prev, recoveryQuestions: nextQuestions };
                                      });
                                    }}
                                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:border-primary focus:outline-none"
                                  >
                                    {PREBUILT_RECOVERY_QUESTIONS.map((question) => (
                                      <option key={`${idx}-${question}`} value={question}>
                                        {question}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={twoFa.recoveryQuestions[idx] || ''}
                                    onChange={(e) =>
                                      setTwoFa((prev) => {
                                        const nextQuestions = [...prev.recoveryQuestions];
                                        nextQuestions[idx] = e.target.value;
                                        return { ...prev, recoveryQuestions: nextQuestions };
                                      })
                                    }
                                    className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                    placeholder={`Custom question ${idx + 1}`}
                                  />
                                )}
                                <input
                                  type="text"
                                  value={recoveryAnswers[idx] || ''}
                                  onChange={(e) =>
                                    setRecoveryAnswers((prev) => {
                                      const next = [...prev];
                                      next[idx] = e.target.value;
                                      return next;
                                    })
                                  }
                                  className="h-10 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                                  placeholder={`Answer ${idx + 1}`}
                                />
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={() => navigate('/account/profile')}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving}
                      className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : 'Save authentication method'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>

          <aside className="space-y-4">
            <div className="sticky top-6 space-y-4">
              <div className="border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Security Overview
                    </p>
                    <p className="text-sm font-semibold text-foreground">Current protection</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                </div>
                <div className="space-y-3 text-xs text-muted-foreground">
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Selected method
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background">
                        {twoFa.method === 'sms' ? (
                          <Phone className="h-4 w-4" />
                        ) : twoFa.method === 'authenticator' ? (
                          <Smartphone className="h-4 w-4" />
                        ) : (
                          <Mail className="h-4 w-4" />
                        )}
                      </div>
                      <span className="text-sm font-medium text-foreground">
                        {twoFa.method === 'sms'
                          ? 'SMS OTP'
                          : twoFa.method === 'authenticator'
                            ? 'Authenticator app'
                            : 'Email code'}
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      MFA blocks most stolen-password login attempts.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Keep backup codes in a secure password manager.
                    </li>
                    <li className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      Changes apply to your next sign-in.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {isTourOpen && (
        <>
          <div className="fixed inset-0 z-50 pointer-events-none bg-black/45" />
          {tourTargetRect && (
            <div
              className="fixed z-[52] rounded-xl border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none transition-all duration-300"
              style={{
                top: tourTargetRect.top - 8,
                left: tourTargetRect.left - 8,
                width: tourTargetRect.width + 16,
                height: tourTargetRect.height + 16,
              }}
            />
          )}

          {tourTargetRect && (
            <div
              className="fixed z-[53] w-[min(360px,calc(100vw-24px))] rounded-2xl border border-border bg-card shadow-2xl"
              style={{
                top: Math.min(
                  Math.max(12, tourTargetRect.top + tourTargetRect.height + 14),
                  window.innerHeight - 260
                ),
                left: Math.min(
                  Math.max(12, tourTargetRect.left),
                  window.innerWidth - Math.min(360, window.innerWidth - 24) - 12
                ),
              }}
            >
              <div className="flex items-start justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Guided tour
                  </p>
                  <h3 className="text-sm font-semibold text-foreground">
                    Step {tourStepIndex + 1} of {tourSteps.length}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTourOpen(false)}
                  className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label="Close guided tour"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {tourSteps[tourStepIndex].title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {tourSteps[tourStepIndex].description}
                  </p>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${((tourStepIndex + 1) / tourSteps.length) * 100}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setTourStepIndex((prev) => Math.max(0, prev - 1))}
                    disabled={tourStepIndex === 0}
                    className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    Back
                  </button>
                  <div className="flex items-center gap-2">
                    {tourStepIndex < 2 && (
                      <button
                        type="button"
                        onClick={runTourStepAction}
                        className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/15"
                      >
                        Do this step
                      </button>
                    )}
                    {tourStepIndex < tourSteps.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => setTourStepIndex((prev) => Math.min(tourSteps.length - 1, prev + 1))}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Next
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsTourOpen(false)}
                        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
                      >
                        Finish
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AuthMethodsPage;

