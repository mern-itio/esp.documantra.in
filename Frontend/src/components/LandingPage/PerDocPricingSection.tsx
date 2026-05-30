import React, { useState, useEffect, useRef } from 'react';
import { Info, Check } from 'lucide-react';
import Lottie from 'lottie-react';
import aadhaarPhotoMatchAnim from '../../assets/lottie/Aadhar-card.json';
import biometric from '../../assets/lottie/Fingerprint-verification.json';
import otpVerification from '../../assets/lottie/OTP-Verification.json';
import crytoVerification from '../../assets/lottie/Security.json';

// Document sending is free. Only verification methods (except Cryptographic) are charged.
export type VerificationMethodId =
  | 'cryptographic'
  | 'aadhar'
  | 'otp'
  | 'biometric';

export type OtpMethodOption = 'email' | 'whatsapp' | 'sms';

export type VerificationMethod = {
  id: VerificationMethodId;
  label: string;
  price: number; // 0 = free (Cryptographic)
};

export const VERIFICATION_METHODS: VerificationMethod[] = [
  { id: 'cryptographic', label: 'Cryptographic Signature', price: 0 },
  { id: 'aadhar', label: 'Aadhar Based Verification', price: 40 },
  { id: 'otp', label: 'OTP Verification', price: 25 },
  { id: 'biometric', label: 'Biometric Verification', price: 60 },
];

export type VerificationSelection = {
  totalPrice: number;
  selectedIds: VerificationMethodId[];
  otpMethod: OtpMethodOption;
};

// Legacy exports for backward compatibility (ChoosePlanPage can migrate fully later)
export type PerDocTabId = 'base' | 'prime' | 'apex';
export const PER_DOC_PLANS = {
  base: { name: 'Base', price: 0 },
  prime: { name: 'Prime', price: 0 },
  apex: { name: 'Apex', price: 0 },
} as const;

type PerDocPricingSectionProps = {
  initialTab?: PerDocTabId;
  value?: PerDocTabId;
  onTabChange?: (tab: PerDocTabId) => void;
  footerNote?: React.ReactNode;
  embedded?: boolean;
  /** Called when selected verification methods or OTP method change */
  onSelectionChange?: (selection: VerificationSelection) => void;
};

const PerDocPricingSection: React.FC<PerDocPricingSectionProps> = ({
  footerNote,
  embedded = false,
  onSelectionChange,
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [infoTooltipOpen, setInfoTooltipOpen] = useState(false);
  const infoButtonRef = useRef<HTMLButtonElement>(null);
  const infoPopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!infoTooltipOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        infoButtonRef.current?.contains(e.target as Node) ||
        infoPopoverRef.current?.contains(e.target as Node)
      )
        return;
      setInfoTooltipOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [infoTooltipOpen]);

  const [selectedIds, setSelectedIds] = useState<Set<VerificationMethodId>>(
    () => new Set(['cryptographic']),
  );
  const [otpMethod, setOtpMethod] = useState<OtpMethodOption>('email');

  const toggleMethod = (id: VerificationMethodId) => {
    if (id === 'cryptographic') return; // always included, cannot deselect
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const totalPrice = VERIFICATION_METHODS.reduce(
    (sum, m) => sum + (selectedIds.has(m.id) ? m.price : 0),
    0,
  );

  useEffect(() => {
    onSelectionChange?.({
      totalPrice,
      selectedIds: Array.from(selectedIds),
      otpMethod,
    });
  }, [totalPrice, selectedIds, otpMethod, onSelectionChange]);

  const sectionClassName = embedded ? '' : 'py-8';
  const containerClassName = embedded
    ? ''
    : 'container-max max-w-xl px-4 sm:px-6 lg:px-8';

  return (
    <>
      {/* Description modals for each verification method */}
      {activeModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#F7F3EE] p-6 shadow-xl">
            {activeModal === 'Cryptographic Signature' && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">
                  Cryptographic Signature
                </h3>
                <div className="mt-4 flex justify-center">
                  <Lottie
                    animationData={crytoVerification}
                    loop
                    autoPlay
                    className="h-30 w-auto"
                  />
                </div>
                <p className="details-text mt-4">
                  Apply a cryptographic digital signature that uses encryption and
                  secure key pairs to validate the signer’s identity and protect the
                  integrity of the document.
                </p>
                <p className="text-heading mt-2">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-700">
                  <li>Ensures document integrity with tamper-evident encryption.</li>
                  <li>Authenticates the signer through secure digital certificates.</li>
                  <li>Provides legally enforceable and compliant digital signatures.</li>
                </ul>
              </>
            )}

            {activeModal === 'Aadhar Based Verification' && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">
                  Aadhar Based Verification
                </h3>
                <div className="mt-4 flex justify-center">
                  <Lottie
                    animationData={aadhaarPhotoMatchAnim}
                    loop
                    autoPlay
                    className="h-30 w-auto"
                  />
                </div>
                <p className="details-text mt-4">
                  Compare a live capture of the signer with the photo from their
                  Aadhaar document to help confirm that the person signing is the
                  same person on record.
                </p>
                <p className="text-heading mt-2">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-700">
                  <li>Aligns the signing experience with Aadhaar‑based verification.</li>
                  <li>Helps reduce the risk of impersonation.</li>
                  <li>Supports additional checks for higher‑risk agreements.</li>
                </ul>
              </>
            )}

            {activeModal === 'OTP Verification' && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">
                  OTP Verification
                </h3>
                <div className="mt-4 flex justify-center">
                  <Lottie
                    animationData={otpVerification}
                    loop
                    autoPlay
                    className="h-30 w-auto"
                  />
                </div>
                <p className="details-text mt-4">
                  Send a One-Time Password (OTP) to the signer's registered mobile
                  number or email address to verify their identity before completing
                  the signing process.
                </p>
                <p className="text-heading mt-3">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-700">
                  <li>Adds an extra layer of authentication during signing.</li>
                  <li>Helps confirm access to the registered mobile or email.</li>
                  <li>Reduces unauthorized access and fraudulent approvals.</li>
                </ul>
              </>
            )}

            {activeModal === 'Biometric Verification' && (
              <>
                <h3 className="text-lg font-semibold text-slate-900">
                  Biometric Verification
                </h3>
                <div className="mt-4 flex justify-center">
                  <Lottie
                    animationData={biometric}
                    loop
                    autoPlay
                    className="h-30 w-auto"
                  />
                </div>
                <p className="details-text mt-4">
                  Verify the signer’s identity using biometric authentication such as
                  fingerprint or facial recognition to ensure the person signing is
                  physically present and authorized.
                </p>
                <p className="text-heading mt-2">Key benefits</p>
                <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-slate-700">
                  <li>Confirms identity through unique biological traits.</li>
                  <li>Minimizes the risk of identity fraud and impersonation.</li>
                  <li>Strengthens compliance for high-value or sensitive agreements.</li>
                </ul>
              </>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="rounded-full bg-[#084bdc] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#084bdc]/90"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verification methods list — no plans, document sending is free */}
      <section className={sectionClassName}>
        <div className={containerClassName}>
          <div className="mx-auto">
            <div className="md:p-8">
              <p className="price-heading">
              You're almost there - just one step left
              </p>
              <p className="mt-1 text-center text-xs text-slate-600">
              You’ve completed all the major steps. Review your verification settings and send your document securely.
              </p>

              <div className="mt-6 relative">
                <h4 className="flex items-center gap-1.5 font-bold text-slate-900">
                  Authentication methods
                  <button
                    ref={infoButtonRef}
                    type="button"
                    onClick={() => setInfoTooltipOpen((v) => !v)}
                    className="inline-flex rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    aria-label="Learn about verification methods"
                    aria-expanded={infoTooltipOpen}
                  >
                    <Info className="h-4 w-4" />
                  </button>
                </h4>

                {infoTooltipOpen && (
                  <div
                    ref={infoPopoverRef}
                    role="tooltip"
                    className="absolute left-0 bottom-full z-30 mb-2 w-full max-w-md rounded-xl border border-[#E6D8C9] bg-[#dbdee7] text-white p-4 text-left shadow-lg"
                  >
                    <p className="details-text">
                      Verification methods add layers of identity checks before a signer can complete the document. <strong>Cryptographic Signature</strong> is always included at no cost and ensures document integrity. You can add <strong>Aadhar</strong>, <strong>OTP</strong> (via Email, WhatsApp, or SMS), and <strong>Biometric</strong> verification for stronger authentication—each added method is charged as shown. Choose only what you need for your document.
                    </p>
                    <button
                      type="button"
                      onClick={() => setInfoTooltipOpen(false)}
                      className="mt-3 text-xs font-medium text-[#084bdc] hover:underline"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-3 divide-y divide-slate-200 rounded-xl border border-[#E6D8C9] bg-[#F5F2EE]/40">
                {VERIFICATION_METHODS.map((method) => {
                  const isSelected = selectedIds.has(method.id);
                  const isLocked = method.id === 'cryptographic';

                  return (
                    <div
                      key={method.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-3 py-3 sm:py-2"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleMethod(method.id)}
                          disabled={isLocked}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                            isLocked
                              ? 'border-emerald-300 bg-emerald-100 cursor-default'
                              : isSelected
                                ? 'border-[#084bdc] bg-[#084bdc] text-white'
                                : 'border-slate-300 bg-[#F7F3EE] hover:border-slate-400'
                          }`}
                          aria-label={isSelected ? `Remove ${method.label}` : `Add ${method.label}`}
                        >
                          {isSelected && <Check className="h-3 w-3" strokeWidth={3} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveModal(method.label)}
                          className="text-left text-xs font-medium text-slate-800 hover:underline"
                        >
                          {method.label}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {method.id === 'otp' && isSelected && (
                          <select
                            value={otpMethod}
                            onChange={(e) =>
                              setOtpMethod(e.target.value as OtpMethodOption)
                            }
                            className="h-8 min-w-[100px] rounded-lg border border-slate-300 bg-[#F7F3EE] px-2 text-xs font-medium text-slate-800 shadow-sm focus:border-slate-900 focus:outline-none"
                          >
                            <option value="email">Email OTP</option>
                            <option value="whatsapp">WhatsApp</option>
                            <option value="sms">SMS</option>
                          </select>
                        )}
                        <span
                          className={`min-w-[3.5rem] text-right text-sm font-semibold ${
                            method.price === 0 ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {method.price === 0 ? 'Free' : `₹${method.price}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border-2 border-[#084bdc] bg-sky-50/80 px-4 py-3">
                <span className="text-sm font-bold text-slate-900">
                  Total (per document)
                </span>
                <span className="text-lg font-bold text-[#084bdc]">
                  ₹{totalPrice}
                </span>
              </div>

              {footerNote && <div className="mt-4">{footerNote}</div>}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PerDocPricingSection;
