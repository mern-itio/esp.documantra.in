import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FilePen, FileSignature, Stamp } from 'lucide-react';
import { usePublicSign } from './PublicSignContext';
import type { PublicAction } from './publicSignTypes';

const OPTIONS: {
  id: PublicAction;
  title: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
}[] = [
  {
    id: 'sign',
    title: 'Sign',
    description: 'Collect signatures on your document',
    icon: <FileSignature className="h-6 w-6" />,
    enabled: true,
  },
  {
    id: 'sign-notarize',
    title: 'Sign + Notarize',
    description: 'Coming soon',
    icon: <Stamp className="h-6 w-6" />,
    enabled: false,
  },
  {
    id: 'edit-fill',
    title: 'Edit & Fill',
    description: 'Coming soon',
    icon: <FilePen className="h-6 w-6" />,
    enabled: false,
  },
];

const ActionPage: React.FC = () => {
  const navigate = useNavigate();
  const { files, action, setAction } = usePublicSign();

  React.useEffect(() => {
    if (files.length === 0) {
      navigate('/public-sign', { replace: true });
    }
  }, [files.length, navigate]);

  const onNext = () => {
    if (action !== 'sign') return;
    navigate('/public-sign/signers');
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="text-center text-2xl font-bold text-slate-900">
        What do you want to do?
      </h1>
      <p className="mt-2 text-center text-sm text-slate-600">
        Choose how you want to work with your document.
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((opt) => {
          const selected = action === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={!opt.enabled}
              onClick={() => opt.enabled && setAction(opt.id)}
              className={`flex flex-col items-center rounded-xl border-2 p-5 text-center transition ${
                !opt.enabled
                  ? 'cursor-not-allowed border-slate-100 bg-slate-50 opacity-60'
                  : selected
                    ? 'border-[#2563eb] bg-sky-50 text-[#2563eb]'
                    : 'border-slate-200 hover:border-[#2563eb]/50'
              }`}
            >
              <span className="mb-3">{opt.icon}</span>
              <span className="font-semibold text-slate-900">{opt.title}</span>
              <span className="mt-1 text-xs text-slate-500">{opt.description}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          onClick={() => navigate('/public-sign')}
          className="rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={action !== 'sign'}
          className="rounded-full bg-[#2563eb] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ActionPage;
