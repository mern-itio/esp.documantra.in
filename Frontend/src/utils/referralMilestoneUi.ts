/**
 * HTML body for Swal when first-send referral hook fires (e-sign may return credits-only or other reward types).
 */
export function referralMilestoneSwalHtml(milestone: {
  rewardCredits?: number;
  rewardSummary?: { rewardType?: string; credits?: number | null; role?: string } | null;
} | null | undefined): string {
  const credits = Number(milestone?.rewardCredits ?? 0);
  const summary = milestone?.rewardSummary;
  const base = 'You sent your first document successfully.';
  if (summary?.rewardType === 'credits' && credits > 0) {
    return `${base}<br/><b>${credits} credits</b> have been added to your account.`;
  }
  if (summary?.rewardType && summary.rewardType !== 'credits') {
    return `${base}<br/>Your reward is unlocked — open <b>Account → Rewards</b> for details.`;
  }
  if (credits > 0) {
    return `${base}<br/><b>${credits} credits</b> have been added to your account.`;
  }
  return `${base}<br/>Check <b>Rewards</b> for any unlocked benefits.`;
}
