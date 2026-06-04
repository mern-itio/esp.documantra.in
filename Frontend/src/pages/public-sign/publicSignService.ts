import type { PublicRecipient } from './publicSignTypes';
import { setPublicFlowSession } from './publicFlowSession';
import {
  checkPublicWizardBackend,
  publicWizardAddRecipients,
  publicWizardUpload,
} from './publicSignApi';

const DEFAULT_AUTH_METHOD_ID = '68ee2a18ba0c0738eb275d34';
const DEFAULT_AUTH_JSON = JSON.stringify([
  { authMethodId: DEFAULT_AUTH_METHOD_ID, status: 'pending' },
]);

function resolveSenderEmail(recipients: PublicRecipient[]): string {
  const me = recipients.find((r) => r.isMe);
  const first = recipients.find((r) => r.email.trim());
  return (me?.email || first?.email || '').trim().toLowerCase();
}

export { checkPublicWizardBackend };

export async function createPublicEnvelope(params: {
  files: File[];
  recipients: PublicRecipient[];
  envelopeType?: string;
  subject?: string;
}): Promise<{ envelopeId: string; publicFlowToken?: string }> {
  const backend = await checkPublicWizardBackend();
  if (!backend.ok) {
    throw new Error(backend.message);
  }

  if (!params.files.length) {
    throw new Error('Please upload at least one PDF.');
  }

  const invalid = params.files.filter(
    (f) => f.type !== 'application/pdf' && !/\.pdf$/i.test(f.name)
  );
  if (invalid.length > 0) {
    throw new Error('Only PDF files are allowed.');
  }

  const envelopetype = params.envelopeType?.trim() || 'Sign';
  const subject =
    params.subject?.trim() ||
    params.files[0].name.replace(/\.pdf$/i, '') ||
    'Document';
  const senderEmail = resolveSenderEmail(params.recipients);

  let envelopeId: string | null = null;

  for (const file of params.files) {
    const formData = new FormData();
    formData.append('files', file, file.name);
    if (envelopeId) formData.append('envelopeId', envelopeId);
    formData.append('subject', subject);
    formData.append('message', '');
    formData.append('envelopetype', envelopetype);
    if (senderEmail) formData.append('senderEmail', senderEmail);

    const result = await publicWizardUpload(formData);
    envelopeId = result.envelopeId;
  }

  if (!envelopeId) {
    throw new Error('Failed to upload document. Please try again.');
  }

  const recipientPayload = params.recipients
    .filter((r) => r.name.trim() && r.email.trim())
    .map((r, index) => ({
      name: r.name.trim(),
      email: r.email.trim(),
      role: 'signer' as const,
      order: index + 1,
      status: 'waiting' as const,
      authentication: DEFAULT_AUTH_JSON,
    }));

  if (recipientPayload.length === 0) {
    throw new Error('Add at least one signer with name and email.');
  }

  const { envelopeId: finalId, publicFlowToken } =
    await publicWizardAddRecipients({
      envelopeId,
      recipients: recipientPayload,
      ...(senderEmail ? { senderEmail } : {}),
    });

  if (publicFlowToken) {
    setPublicFlowSession(finalId, publicFlowToken);
  }

  return { envelopeId: finalId, publicFlowToken };
}
