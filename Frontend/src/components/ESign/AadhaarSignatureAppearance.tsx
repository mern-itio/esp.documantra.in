import React, { useEffect, useState } from 'react';
import {
  buildVSignAppearanceLines,
  prepareHandwrittenForDual,
  type VSignAppearanceRecipient,
} from '../../utils/vsignAppearance';

type RecipientLike = VSignAppearanceRecipient | null;

type AadhaarProps = {
  recipient?: RecipientLike;
  className?: string;
  fontSizePx?: number;
  /** Shrink width to longest text line (reference attachment). */
  fitContent?: boolean;
  /** When nested inside DualSignature — no second blue plate. */
  embedded?: boolean;
};

/** Reference VSign block: #E8F2FF box, large green tick watermark behind professional text. */
export const AadhaarSignatureAppearance: React.FC<AadhaarProps> = ({
  recipient,
  className = '',
  fontSizePx = 8,
  fitContent = false,
  embedded = false,
}) => {
  const lines = buildVSignAppearanceLines(recipient);

  return (
    <div
      className={`relative overflow-hidden ${
        embedded ? 'bg-transparent' : 'bg-[#E8F2FF]'
      } ${fitContent ? 'w-max max-w-full' : 'w-full h-full'} ${className}`}
      aria-label="Aadhaar digital signature appearance"
    >
      <svg
        className="absolute z-0 pointer-events-none text-[#16a34a]"
        style={{
          left: '2%',
          bottom: '1%',
          width: '50%',
          height: '92%',
        }}
        viewBox="-8 -8 116 116"
        preserveAspectRatio="xMinYMax meet"
        fill="none"
        aria-hidden
      >
        <path
          d="M6 58 L28 80 L92 14"
          stroke="currentColor"
          strokeWidth="18"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className={`relative z-10 flex flex-col ${
          fitContent ? 'py-1.5 pl-2 pr-2.5' : 'justify-center h-full px-1.5 py-0.5'
        } font-medium text-black`}
        style={{
          fontSize: fontSizePx,
          lineHeight: 1.35,
          fontFamily: '"Times New Roman", Times, Georgia, serif',
        }}
      >
        {lines.map((line) => (
          <div key={line} className="whitespace-nowrap">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
};

export type DualSignatureAppearanceProps = {
  handwrittenSrc?: string | null;
  recipient?: RecipientLike;
  fontSizePx?: number;
  showDigital?: boolean;
  showEdit?: boolean;
  onEditClick?: (e: React.MouseEvent) => void;
  bottomAction?: React.ReactNode;
  maxWidth?: number;
  /** Minimum width for pending (handwritten + CTA) card. */
  minWidth?: number;
  fitContent?: boolean;
};

/**
 * Handwritten on top, Aadhaar block below.
 * fitContent: width comes ONLY from Aadhaar text (w-max). Handwritten is
 * position:absolute so a wide SignPad PNG cannot stretch the blue box or
 * leave a white top-right blank.
 */
export const DualSignatureAppearance: React.FC<DualSignatureAppearanceProps> = ({
  handwrittenSrc,
  recipient,
  fontSizePx = 8,
  showDigital = true,
  showEdit = false,
  onEditClick,
  bottomAction,
  maxWidth,
  minWidth,
  fitContent = false,
}) => {
  // Never show the raw SignPad PNG (white canvas). Wait for blue-baked ink.
  const [cleanHandwrittenSrc, setCleanHandwrittenSrc] = useState<string | null>(null);
  const isPendingCta = Boolean(bottomAction) && !showDigital;
  const stripH = isPendingCta
    ? Math.max(52, fontSizePx * 5.2)
    : Math.max(32, fontSizePx * 3.6);
  const resolvedMinWidth = minWidth ?? (isPendingCta ? 260 : undefined);

  useEffect(() => {
    let cancelled = false;
    if (!handwrittenSrc) {
      setCleanHandwrittenSrc(null);
      return undefined;
    }
    setCleanHandwrittenSrc(null);
    prepareHandwrittenForDual(handwrittenSrc).then((next) => {
      if (!cancelled) setCleanHandwrittenSrc(next);
    });
    return () => {
      cancelled = true;
    };
  }, [handwrittenSrc]);

  return (
    <div
      className={`relative inline-flex flex-col rounded-md bg-[#E8F2FF] ${
        showEdit ? 'overflow-visible' : 'overflow-hidden'
      } ${fitContent ? 'w-max' : 'w-full max-w-full'} ${
        isPendingCta
          ? 'border border-[#c5d9f0] shadow-[0_2px_10px_rgba(15,55,100,0.10)]'
          : ''
      }`}
      style={{
        isolation: 'isolate',
        minWidth: resolvedMinWidth,
        ...(fitContent
          ? maxWidth
            ? { maxWidth }
            : undefined
          : maxWidth
            ? { maxWidth, width: maxWidth }
            : undefined),
      }}
    >
      {handwrittenSrc ? (
        <div
          className={`relative z-10 shrink-0 bg-[#E8F2FF] ${
            isPendingCta ? 'px-3 pt-3 pb-2' : ''
          }`}
          style={
            fitContent
              ? {
                  // Take text-driven width only; do not let img intrinsic size expand box.
                  width: 0,
                  minWidth: '100%',
                  height: stripH + (isPendingCta ? 16 : 10),
                }
              : { width: '100%', height: stripH + (isPendingCta ? 16 : 10) }
          }
        >
          {cleanHandwrittenSrc ? (
            <img
              src={cleanHandwrittenSrc}
              alt="Signature"
              className={`pointer-events-none absolute z-[1] object-contain object-left ${
                isPendingCta ? 'left-3 top-3' : 'left-1.5 top-1.5'
              }`}
              style={{
                maxHeight: stripH,
                maxWidth: isPendingCta ? '72%' : '40%',
                width: 'auto',
                height: 'auto',
              }}
            />
          ) : null}
          {/* Solid blue plate over top-right — kills transparent-PNG→white in every browser. */}
          {!isPendingCta ? (
            <div
              className="pointer-events-none absolute inset-y-0 right-0 z-[2] bg-[#E8F2FF]"
              style={{ width: '58%' }}
              aria-hidden
            />
          ) : null}
        </div>
      ) : null}
      {showDigital ? (
        <AadhaarSignatureAppearance
          recipient={recipient}
          fontSizePx={fontSizePx}
          fitContent={fitContent}
          embedded
        />
      ) : (
        bottomAction
      )}
      {showEdit && handwrittenSrc && onEditClick ? (
        <button
          type="button"
          className="pointer-events-auto absolute -top-2.5 -right-2.5 z-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#248567] text-white shadow-md transition hover:scale-105 hover:bg-[#1f7158] focus:outline-none focus:ring-2 focus:ring-[#248567]/40"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditClick(e);
          }}
          aria-label="Edit signature"
          title="Edit signature"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.25">
            <path d="M12 20h9M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
      ) : null}
    </div>
  );
};

/** Sample handwritten stroke for sign-appearance demo (no real sign required). */
export const DEMO_HANDWRITTEN_SIGNATURE_SRC =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 60" width="220" height="60">
      <path d="M12 42 C35 8, 55 52, 78 28 S120 12, 145 38 S175 48, 205 22"
        fill="none" stroke="#1e40af" stroke-width="3" stroke-linecap="round"/>
    </svg>`,
  );

export default AadhaarSignatureAppearance;
