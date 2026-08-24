import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import SignatureCanvas from 'react-signature-canvas';
import { PenLine } from 'lucide-react';
import {
  AadhaarSignatureAppearance,
  DEMO_HANDWRITTEN_SIGNATURE_SRC,
  DualSignatureAppearance,
} from '../../components/ESign/AadhaarSignatureAppearance';
import { resolveVSignAppearanceRecipient } from '../../utils/vsignAppearance';

const demoRecipientBase = {
  name: 'Arun Dixit',
  aadhaarNumber: '1234567894693',
};

/**
 * Standalone sign appearance preview — draw or upload your real signature.
 * URL: /e-sign/sign-appearance-demo
 */
const SignAppearanceDemoPage: React.FC = () => {
  const canvasRef = useRef<SignatureCanvas | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [realSignature, setRealSignature] = useState<string | null>(null);

  const captureDrawn = () => {
    if (!canvasRef.current || canvasRef.current.isEmpty()) return;
    setRealSignature(canvasRef.current.getTrimmedCanvas().toDataURL('image/png'));
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setRealSignature(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearSignature = () => {
    canvasRef.current?.clear();
    setRealSignature(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-4">
      <div className="mx-auto max-w-lg">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Sign appearance demo</h1>
            <p className="mt-1 text-sm text-gray-600">
              Draw or upload your signature — preview matches the live Aadhaar dual-sign layout.
            </p>
          </div>
          <Link
            to="/"
            className="shrink-0 text-sm text-blue-600 hover:text-blue-800"
          >
            Home
          </Link>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Your signature
          </p>
          <div className="rounded border border-gray-300 bg-white">
            <SignatureCanvas
              ref={canvasRef}
              penColor="#1e40af"
              canvasProps={{
                className: 'w-full h-28 cursor-crosshair',
              }}
              onEnd={captureDrawn}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={captureDrawn}
              className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              Use drawn signature
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={clearSignature}
              className="rounded px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              Clear
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onUpload}
            />
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            Pending Aadhaar (after draw, before OTP) — yellow Sign must stay visible
          </p>
          <DualSignatureAppearance
            handwrittenSrc={realSignature || DEMO_HANDWRITTEN_SIGNATURE_SRC}
            recipient={resolveVSignAppearanceRecipient(demoRecipientBase, {
              storedAadhaar: null,
            })}
            fontSizePx={12}
            showDigital={false}
            showEdit
            fitContent
            minWidth={280}
            bottomAction={
              <button
                type="button"
                className="pointer-events-auto w-full border-t border-[#e0c14a] bg-[#f5c518] px-3 py-2.5 text-center transition hover:bg-[#e6b800]"
              >
                <span className="inline-flex items-center justify-center gap-2 text-[14px] font-bold tracking-wide text-gray-900">
                  <PenLine className="h-4 w-4" />
                  Sign
                </span>
                <p className="mt-0.5 text-[10px] font-medium leading-snug text-gray-700">
                  Verify with Aadhaar OTP
                </p>
              </button>
            }
          />
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            After Aadhaar OTP (dual stamp)
          </p>
          <DualSignatureAppearance
            handwrittenSrc={realSignature || DEMO_HANDWRITTEN_SIGNATURE_SRC}
            recipient={resolveVSignAppearanceRecipient(demoRecipientBase, {
              storedAadhaar: null,
            })}
            fontSizePx={9}
            showDigital
            fitContent
          />
          <p className="mt-4 text-xs text-gray-500">
            Live envelopes keep the yellow Sign until OTP completes — Finish only appears after
            verification.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
            Aadhaar block only (reference)
          </p>
          <AadhaarSignatureAppearance
            recipient={resolveVSignAppearanceRecipient(demoRecipientBase)}
            fontSizePx={9}
            fitContent
          />
        </div>
      </div>
    </div>
  );
};

export default SignAppearanceDemoPage;
