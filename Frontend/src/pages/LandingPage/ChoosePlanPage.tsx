import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, CheckCircle2, Info, Pen, X } from 'lucide-react';
import PerDocPricingSection, {
  type VerificationSelection,
} from '../../components/LandingPage/PerDocPricingSection';
import { APP_NAME } from '../../components/constants/appConfig';

type OtpContextState = {
  otpMethod?: 'whatsapp' | 'email' | 'sms';
  otpTarget?: string;
  signers?: {
    id: string;
    fullName: string;
    email: string;
  }[];
};

const ChoosePlanPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as OtpContextState;

  const [verificationSelection, setVerificationSelection] =
    useState<VerificationSelection | null>(null);
  const [fareOpen, setFareOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editSignersOpen, setEditSignersOpen] = useState(false);
  const [paymentDoneOpen, setPaymentDoneOpen] = useState(false);
  const [signersOrder, setSignersOrder] = useState<OtpContextState['signers']>(
    state.signers ?? [],
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [docTypeOpen, setDocTypeOpen] = useState(false);
  const [docType, setDocType] = useState<'general' | 'affidavit' | 'agreement' | 'indemnity'>(
    'general',
  );

  useEffect(() => {
    setSignersOrder(state.signers ?? []);
  }, [state.signers]);

  const signerCount = Math.max(1, signersOrder?.length ?? 1);
  const verificationTotal = verificationSelection?.totalPrice ?? 0;
  const orderTotal = verificationTotal * signerCount;
  // Apply the same 18% GST used in the fare breakdown modal
  const orderTotalWithGst =
    orderTotal === 0
      ? 0
      : Number((orderTotal * 1.18).toFixed(2));

  const handleBack = () => {
    navigate(-1);
  };

  const handlePay = () => {
    // Placeholder for payment step integration
    console.log('Proceed to payment with', {
      verificationTotal,
      orderTotal,
      otpMethod: verificationSelection?.otpMethod ?? state.otpMethod,
      signerCount,
      signers: signersOrder,
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Step banner */}
      <div className="flex items-center justify-center border-b border-amber-200 bg-amber-50 py-3">
        <span className="rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-800">
          Step 2: Select Authentication Method
        </span>
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Sign order + document type */}
        {signersOrder && signersOrder.length > 1 && (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sign Order
                </p>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-800">
                  {signersOrder.map((s, index) => (
                    <React.Fragment key={s.id}>
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                        <span className="max-w-[120px] truncate font-medium">
                          {s.fullName}
                        </span>
                      </span>

                      {index < signersOrder.length - 1 && (
                        <span className="text-[5px] text-slate-400">
                          <svg
                            viewBox="0 0 100 20"
                            width="20"
                            height="40"
                            xmlns="http://www.w3.org"
                          >
                            <line
                              x1="0"
                              y1="10"
                              x2="80"
                              y2="10"
                              stroke="black"
                              strokeWidth="5"
                            />
                            <polygon points="80,2 110,10 80,18" fill="black" />
                          </svg>
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditSignersOpen(true)}
                className="mt-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pen className="h-3 w-3" />
              </button>
            </div>
          </section>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Document Type
            </p>
            <button
              type="button"
              onClick={() => setDocTypeOpen(true)}
              className="text-xs font-medium text-sky-600 hover:text-sky-700"
            >
              <Pen className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {docType === 'general'
              ? 'General Document'
              : docType === 'affidavit'
                ? 'Affidavit'
                : docType === 'agreement'
                  ? 'Agreement'
                  : 'Indemnity Bond'}
          </p>
        </div>
        {/* Safety level selector + plan detail using shared pricing component */}
        <section className="rounded-2xl border border-slate-200 bg-white/50 p-4 sm:p-6">
          {/* <h2 className="text-sm font-semibold text-slate-900 mb-2">Choose Safety Level</h2> */}

          <PerDocPricingSection
            embedded
            onSelectionChange={setVerificationSelection}
            footerNote={
              state.otpMethod ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  OTP verified via{' '}
                  <span className="font-semibold">
                    {state.otpMethod === 'whatsapp'
                      ? 'WhatsApp'
                      : state.otpMethod === 'email'
                        ? 'Email'
                        : 'SMS'}
                  </span>
                  {state.otpTarget ? ` on ${state.otpTarget}.` : '.'}
                </p>
              ) : null
            }
          />
        </section>
      </main>
      {/* Bottom pay bar */}
      <footer className="sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-2px_10px_rgba(15,23,42,0.08)] sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-1 items-center justify-end gap-3 sm:flex-none">
            <button
              type="button"
              onClick={() => setFareOpen(true)}
              className="inline-flex items-center gap-1 mt-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Info className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              className="rounded-full bg-[#084bdc] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#084bdc]/90"
            >
              {orderTotalWithGst === 0 ? 'Confirm' : `Pay ₹${orderTotalWithGst}`}
            </button>
          </div>
        </div>
      </footer>
      {/* Confirm signer details modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="price-heading">
                Confirm Signer Details
              </h2>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 text-sm text-slate-800">
              <p className="details-text mb-4">
              Verify the signer information and modify the sequence if needed. Drag and drop to define the signing order.
              </p>

              <div className="mt-3 space-y-2">
                {signersOrder && signersOrder.length > 0 ? (
                  signersOrder.map((s, index) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === index) return;
                        setSignersOrder((prev) => {
                          if (!prev) return prev;
                          const next = [...prev];
                          const [moved] = next.splice(dragIndex, 1);
                          next.splice(index, 0, moved);
                          return next;
                        });
                        setDragIndex(index);
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <span className="cursor-grab active:cursor-grabbing text-slate-400">
                        ⋮⋮
                      </span>
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#084bdc] text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      {/* <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-semibold text-emerald-700">
                        {s.fullName.charAt(0).toUpperCase()}
                      </span> */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900 truncate">{s.fullName}</p>
                        <p className="text-xs text-slate-600 truncate">{s.email}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No signers to reorder. Go back and add recipients first.
                  </p>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false);
                    navigate('/sign-pdf-online/signer', {
                      state: { fromPlan: true },
                    });
                  }}
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmOpen(false);
                    handlePay();
                    setPaymentDoneOpen(true);
                  }}
                  className="rounded-full bg-[#084bdc] px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#084bdc]/90"
                >
                  Confirm & Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit signers (reorder) modal */}
      {editSignersOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Edit Signers</h2>
              <button
                type="button"
                onClick={() => setEditSignersOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 text-sm text-slate-800">
              <p className="text-xs text-slate-600">
                Signers will sign sequentially—drag the handle on the left to change order.
                Also choose each signer&apos;s preferred language.
              </p>

              <div className="mt-4 space-y-2">
                {signersOrder && signersOrder.length > 0 ? (
                  signersOrder.map((s, index) => (
                    <div
                      key={s.id}
                      draggable
                      onDragStart={() => setDragIndex(index)}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (dragIndex === null || dragIndex === index) return;
                        setSignersOrder((prev) => {
                          if (!prev) return prev;
                          const next = [...prev];
                          const [moved] = next.splice(dragIndex, 1);
                          next.splice(index, 0, moved);
                          return next;
                        });
                        setDragIndex(index);
                      }}
                      onDragEnd={() => setDragIndex(null)}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="cursor-move text-slate-400">
                          ⋮⋮
                        </span>
                        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-xs font-semibold text-white">
                          {index + 1}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {s.fullName}
                          </p>
                          <p className="text-xs text-slate-600">{s.email}</p>
                        </div>
                      </div>
                      {/* <button
                        type="button"
                        className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700"
                      >
                        English
                      </button> */}
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">
                    No signers to edit. Go back and add recipients first.
                  </p>
                )}
              </div>

              <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setEditSignersOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setEditSignersOpen(false)}
                  className="rounded-full bg-[#084bdc] px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#084bdc]/90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fare breakdown modal */}
      {fareOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Fare Breakdown</h2>
              <button
                type="button"
                onClick={() => setFareOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {(() => {
              const signingFee = orderTotal;
              const walletUsed = 0;
              const subtotal = signingFee - walletUsed;
              const gstAmount = Number((subtotal * 0.18).toFixed(2));
              const total = Number((subtotal + gstAmount).toFixed(2));

              return (
                <div className="px-6 py-5 text-sm text-slate-800">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>Order Total with GST</span>
                    <span className="text-base font-semibold text-slate-900">
                      ₹{total.toFixed(2)}
                    </span>
                  </div>

                  {/* <div className="mt-4 border-t border-slate-200 pt-4"> */}
                  <div>
                    {/* <p className="text-xs font-semibold text-slate-500">
                      Payable Amount Breakdown:
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-600">Signing Fee</span>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <span className="relative inline-flex h-4 w-7 items-center rounded-full border border-slate-300 bg-slate-200">
                            <span className="absolute h-3 w-3 translate-x-0.5 rounded-full bg-white shadow-sm" />
                          </span>
                          <span>Use Sign Wallet</span>
                        </div>
                      </div>
                      <div className="text-right text-sm font-medium text-slate-900">
                        ₹{signingFee.toFixed(2)}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs text-emerald-600">
                      <span className="pl-[108px]">Wallet discount</span>
                      <span className="text-sm font-medium">-₹{walletUsed.toFixed(2)}</span>
                    </div> */}

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                      <span className="font-medium text-slate-800">Subtotal</span>
                      <span className="font-semibold text-slate-900">
                        ₹{subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-600">
                      <span>Total GST (18%)</span>
                      <span className="text-sm font-medium text-slate-900">
                        ₹{gstAmount.toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3 text-sm">
                      <span className="font-semibold text-slate-900">Total Amount</span>
                      <span className="text-base font-semibold text-slate-900">
                        ₹{total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => setFareOpen(false)}
                      className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFareOpen(false);
                        handlePay();
                      }}
                      className="rounded-full bg-[#084bdc] px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#084bdc]/90"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Edit document type modal */}
      {docTypeOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">Edit Document Type</h2>
              <button
                type="button"
                onClick={() => setDocTypeOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="px-6 py-5 text-sm text-slate-800">
              {(
                [
                  {
                    id: 'general',
                    title: 'General Document',
                    description: 'Everyday documents without stamp paper requirement.',
                    tag: 'Non Legal',
                  },
                  {
                    id: 'affidavit',
                    title: 'Affidavit',
                    description: 'A sworn statement for official or legal purposes.',
                    tag: 'Legal',
                  },
                  {
                    id: 'agreement',
                    title: 'Agreement',
                    description: 'A contract between two or more parties.',
                    tag: 'Legal',
                  },
                  {
                    id: 'indemnity',
                    title: 'Indemnity Bond',
                    description: 'Protects against loss or liability.',
                    tag: 'Legal',
                  },
                ] as const
              ).map((item) => {
                const isActive = docType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDocType(item.id)}
                    className={`mt-2 flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left ${
                      isActive
                        ? 'border-slate-900 bg-slate-900/5'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isActive ? 'text-slate-900' : 'text-slate-800'
                        }`}
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">{item.description}</p>
                    </div>
                    <span
                      className={`ml-4 rounded-full px-3 py-1 text-[11px] font-semibold ${
                        item.tag === 'Legal'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.tag}
                    </span>
                  </button>
                );
              })}

              <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setDocTypeOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setDocTypeOpen(false)}
                  className="rounded-full bg-[#084bdc] px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#084bdc]/90"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment done / Thank you modal */}
      {paymentDoneOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-sky-700 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-300" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-emerald-200">
                    Payment successful
                  </p>
                  <p className="text-lg font-semibold">Thank you for using {APP_NAME}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-5 text-sm text-slate-800">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Amount paid
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">
                    ₹{orderTotal.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-700">
                  {signerCount} signer{signerCount > 1 ? 's' : ''}
                </div>
              </div>

              <div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">Verification</span>
                  <span className="font-semibold text-slate-900">
                    ₹{verificationTotal}/doc × {signerCount} signer{signerCount > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-600">Document type</span>
                  <span className="font-semibold text-slate-900">
                    {docType === 'general'
                      ? 'General Document'
                      : docType === 'affidavit'
                        ? 'Affidavit'
                        : docType === 'agreement'
                          ? 'Agreement'
                          : 'Indemnity Bond'}
                  </span>
                </div>
                {state.signers && state.signers.length > 0 && (
                  <div className="flex items-start justify-between gap-2">
                    <span className="mt-0.5 font-medium text-slate-600">Signers</span>
                    <div className="flex flex-1 flex-wrap justify-end gap-1 text-[11px] text-slate-700">
                      {signersOrder?.map((s) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 shadow-sm"
                        >
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[9px] font-semibold text-white">
                            {s.fullName.charAt(0).toUpperCase()}
                          </span>
                          <span className="max-w-[90px] truncate">{s.fullName}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <p className="mt-4 text-xs text-slate-500">
                A detailed receipt and signing links will be sent to the signer&apos;s
                WhatsApp numbers. You can track the signing status from your dashboard.
              </p>

              <div className="mt-5 flex justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setPaymentDoneOpen(false)}
                  className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentDoneOpen(false);
                    navigate('/sign-pdf-online');
                  }}
                  className="rounded-full bg-[#084bdc] px-5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#084bdc]/90"
                >
                  Go to start
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChoosePlanPage;

