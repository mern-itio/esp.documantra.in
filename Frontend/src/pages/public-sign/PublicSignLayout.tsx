import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { APP_NAME } from '../../components/constants/appConfig';
import { checkPublicWizardBackend } from './publicSignService';

const STEPS = [
  { path: '/public-sign', label: 'Upload' },
  { path: '/public-sign/action', label: 'Action' },
  { path: '/public-sign/signers', label: 'Signers' },
  { path: '/public-sign/recipients', label: 'Recipients' },
];

const PublicSignLayout: React.FC = () => {
  const location = useLocation();
  const activeIndex = STEPS.findIndex((s) => s.path === location.pathname);
  const [backendWarning, setBackendWarning] = useState<string | null>(null);

  useEffect(() => {
    checkPublicWizardBackend().then((r) => {
      setBackendWarning(r.ok ? null : r.message);
    });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-20 pb-16">
      <header className="fixed top-0 left-0 right-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link to="/" className="text-sm font-bold text-[#260559]">
            {APP_NAME}
          </Link>
          <span className="text-xs font-medium text-slate-500">
            No login required to start
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {backendWarning && (
          <div
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            {backendWarning}
          </div>
        )}
        <nav
          className="mb-8 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-500"
          aria-label="Progress"
        >
          {STEPS.map((step, index) => {
            const done = activeIndex > index;
            const current = activeIndex === index;
            return (
              <React.Fragment key={step.path}>
                {index > 0 && (
                  <span
                    className={`h-px w-6 sm:w-10 ${done ? 'bg-[#2563eb]' : 'bg-slate-200'}`}
                  />
                )}
                <span
                  className={`rounded-full px-2.5 py-1 ${
                    current
                      ? 'bg-[#2563eb] text-white'
                      : done
                        ? 'bg-[#2563eb]/15 text-[#2563eb]'
                        : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step.label}
                </span>
              </React.Fragment>
            );
          })}
        </nav>

        <Outlet />
      </div>
    </div>
  );
};

export default PublicSignLayout;
