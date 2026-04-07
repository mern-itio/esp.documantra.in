/**
 * Referral rewards of type `free_auth_method` add perks to GET /user-plan/me (`referralPerks`).
 * Match perk `value.method` to the auth method display name so UI and credit math show "Free".
 */
export function normalizeAuthMethodLabel(s: string): string {
  return s.trim().toLowerCase();
}

export function getReferralFreeAuthMethodNames(
  plan: { referralPerks?: unknown } | null | undefined
): Set<string> {
  const perks = plan?.referralPerks;
  if (!Array.isArray(perks)) return new Set();
  const set = new Set<string>();
  for (const p of perks as { type?: string; value?: { method?: string } }[]) {
    if (!p) continue;
    if (p.type === 'free_auth_method' && typeof p.value?.method === 'string' && p.value.method.trim()) {
      set.add(normalizeAuthMethodLabel(p.value.method));
    }
  }
  return set;
}

export function isAuthMethodFreeViaReferralPerk(
  authMethod: { name?: string } | null | undefined,
  plan: { referralPerks?: unknown } | null | undefined
): boolean {
  if (!authMethod?.name || !plan) return false;
  const freeNames = getReferralFreeAuthMethodNames(plan);
  if (freeNames.size === 0) return false;
  return freeNames.has(normalizeAuthMethodLabel(authMethod.name));
}
