export type CouponStatus = "active" | "claimed" | "expired";
export type CouponCategory = "Credits" | "E-Sign" | "Pricing" | "Templates" | "Security"| "Support"| "Automation"| "Storage";

export interface Coupon {
  id: string;
  title: string;
  description: string;
  rewardValue: string;
  rewardCode: string;
  expiryDate: string;
  status: CouponStatus;
  category: CouponCategory;
  terms?: string;
}

export const coupons: Coupon[] = [
  {
    id: "1",
    title: "New User Credits",
    description: "Get free credits to send your first documents",
    rewardValue: "20 CREDITS",
    rewardCode: "START20",
    expiryDate: "2026-06-15",
    status: "active",
    category: "Credits",
    terms: "Valid for new users only. Applicable on document sending.",
  },
  {
    id: "2",
    title: "Free Signature Pack",
    description: "Send documents without consuming credits",
    rewardValue: "5 FREE SENDS",
    rewardCode: "FREESIGN5",
    expiryDate: "2026-05-30",
    status: "active",
    category: "E-Sign",
    terms: "Valid for standard document workflows only.",
  },
  {
    id: "3",
    title: "Bulk Send Discount",
    description: "Save on bulk document sending",
    rewardValue: "25% OFF",
    rewardCode: "BULK25",
    expiryDate: "2026-07-01",
    status: "active",
    category: "Pricing",
    terms: "Applies to bulk send feature only.",
  },
  {
    id: "4",
    title: "Template Pro Access",
    description: "Unlock premium document templates",
    rewardValue: "FREE ACCESS",
    rewardCode: "TEMPLATEPRO",
    expiryDate: "2026-08-10",
    status: "active",
    category: "Templates",
    terms: "Includes access to advanced reusable templates.",
  },
  {
    id: "5",
    title: "Identity Verification Trial",
    description: "Try secure identity verification at no cost",
    rewardValue: "3 FREE VERIFICATIONS",
    rewardCode: "VERIFY3",
    expiryDate: "2026-04-01",
    status: "expired",
    category: "Security",
    terms: "Supports Email OTP and basic verification methods.",
  },
  {
    id: "6",
    title: "Priority Support Pass",
    description: "Get faster support for your documents",
    rewardValue: "7 DAYS PRIORITY",
    rewardCode: "SUPPORT7",
    expiryDate: "2026-04-10",
    status: "claimed",
    category: "Support",
    terms: "Includes priority email and chat support.",
  },
  {
    id: "7",
    title: "Workflow Automation Boost",
    description: "Enable advanced automation features",
    rewardValue: "15% OFF",
    rewardCode: "AUTO15",
    expiryDate: "2026-09-15",
    status: "active",
    category: "Automation",
    terms: "Applies to automation and workflow features only.",
  },
  {
    id: "8",
    title: "Storage Upgrade",
    description: "Increase your document storage limit",
    rewardValue: "+5GB STORAGE",
    rewardCode: "STORAGE5",
    expiryDate: "2026-06-30",
    status: "active",
    category: "Storage",
    terms: "Additional storage valid for 30 days.",
  },
];
