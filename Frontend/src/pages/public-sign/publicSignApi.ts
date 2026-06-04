/**
 * Public wizard HTTP client — uses fetch (never sends Authorization).
 */

const getBaseUrl = () => {
  const fromEnv = import.meta.env.VITE_ESIGN_SERVICE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'esp.documantra.in' || host.endsWith('.documantra.in')) {
      return 'https://esp.documantra.in/esign';
    }
  }
  return 'https://esp.documantra.in/esign';
};

export async function checkPublicWizardBackend(): Promise<{
  ok: boolean;
  message: string;
}> {
  const base = getBaseUrl();
  try {
    const res = await fetch(`${base}/api/e-sign/public/wizard/health`, {
      method: 'GET',
      cache: 'no-store',
    });
    if (res.status === 401) {
      return {
        ok: false,
        message:
          'Public wizard abhi server par deploy nahi hai (401). e-sign-service restart/deploy karein, phir https://esp.documantra.in/esign/api/e-sign/public/wizard/health check karein.',
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        message: `Public wizard unavailable (HTTP ${res.status}). Redeploy e-sign-service.`,
      };
    }
    const data = await res.json().catch(() => ({}));
    if (data?.status === 'ok') {
      return { ok: true, message: '' };
    }
    return {
      ok: false,
      message: 'Unexpected health response. Redeploy e-sign-service.',
    };
  } catch {
    return {
      ok: false,
      message: `Cannot reach e-sign service at ${base}. Is it running?`,
    };
  }
}

export async function publicWizardUpload(
  formData: FormData
): Promise<{ envelopeId: string }> {
  const res = await fetch(
    `${getBaseUrl()}/api/e-sign/public/wizard/upload`,
    { method: 'POST', body: formData }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      data?.message ||
        (res.status === 401
          ? 'Server requires login — deploy latest e-sign-service with public wizard routes.'
          : `Upload failed (${res.status})`)
    );
  }
  const envelopeId = data?.data?.envelopeId;
  if (!envelopeId) {
    throw new Error('Upload succeeded but no envelopeId returned.');
  }
  return { envelopeId: String(envelopeId) };
}

export async function publicWizardAddRecipients(body: {
  envelopeId: string;
  recipients: unknown[];
  senderEmail?: string;
}): Promise<{ envelopeId: string; publicFlowToken?: string }> {
  const res = await fetch(
    `${getBaseUrl()}/api/e-sign/public/wizard/add-recipients`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.message || `Add recipients failed (${res.status})`);
  }
  return {
    envelopeId: String(data.envelopeId),
    publicFlowToken: data.publicFlowToken,
  };
}
