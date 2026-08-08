import { eSignApi } from './apiHelper';
import { getExistingPublicGuestId, withPublicGuestHeaders } from '../utils/publicGuestId';

/** Link anonymous esign.documantra.in sends to the logged-in ESP account. */
export async function claimPublicGuestEnvelopes(): Promise<number> {
  const guestId = getExistingPublicGuestId();
  if (!guestId) return 0;

  const headers = withPublicGuestHeaders();
  const body = { guestId };
  const endpoints = [
    '/api/e-sign/claim-guest-envelopes',
    '/api/e-sign/public/claim-guest-envelopes',
  ];

  for (const url of endpoints) {
    try {
      const resp = await eSignApi.post(url, body, { headers });
      const claimed = Number(resp.data?.claimed || 0);
      if (claimed > 0) return claimed;
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 404) continue;
    }
  }

  return 0;
}
