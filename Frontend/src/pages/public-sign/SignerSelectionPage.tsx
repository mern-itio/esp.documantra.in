import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserPlus, Users } from 'lucide-react';
import { usePublicSign } from './PublicSignContext';
import type { SignerType } from './publicSignTypes';

const OPTIONS: {
  id: SignerType;
  title: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'me-only',
    title: 'Me Only',
    description: 'You are the only signer',
    icon: <User className="h-6 w-6" />,
  },
  {
    id: 'me-other',
    title: 'Me + Others',
    description: 'You and additional signers',
    icon: <UserPlus className="h-6 w-6" />,
  },
  {
    id: 'others-only',
    title: 'Others Only',
    description: 'Other people sign; you send the envelope',
    icon: <Users className="h-6 w-6" />,
  },
];

const SignerSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, signerType, setSignerType } = usePublicSign();

  React.useEffect(() => {
    if (files.length === 0) {
      navigate('/public-sign', { replace: true });
    }
  }, [files.length, navigate]);

  const onNext = () => {
    if (!signerType) return;
    navigate('/public-sign/recipients');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-center text-2xl font-bold text-slate-900">
        Who needs to sign?
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Select who will sign this document.
      </p>

      <div className="mt-8 grid gap-3">
        {OPTIONS.map((opt) => {
          const selected = signerType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setSignerType(opt.id)}
              className={`flex items-center gap-4 rounded-xl border-2 p-4 text-left transition ${
                selected
                  ? 'border-[#2563eb] bg-sky-50'
                  : 'border-slate-200 hover:border-[#2563eb]/50'
              }`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  selected ? 'bg-[#2563eb] text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {opt.icon}
              </span>
              <span>
                <span className="block font-semibold text-slate-900">{opt.title}</span>
                <span className="text-sm text-slate-500">{opt.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate('/public-sign/action')}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!signerType}
          className="rounded-full bg-[#2563eb] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default SignerSelectionPage;
