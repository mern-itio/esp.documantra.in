import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, X } from 'lucide-react';
import {
  acceptAllCookiePreferences,
  readCookiePreferences,
  saveCookiePreferences,
  type CookiePreferences,
} from '../../utils/cookiePreferences';
import { APP_NAME } from '../../config/brand';

type CookiePreferenceCenterProps = {
  open: boolean;
  onClose: () => void;
};

type CookieCategory = {
  id: keyof Pick<CookiePreferences, 'essential' | 'performance' | 'functional' | 'marketing'>;
  title: string;
  description: string;
  alwaysActive?: boolean;
};

const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    title: 'Strictly Necessary Cookies',
    description:
      'These cookies are necessary for the website to function and cannot be switched off in our systems. They are usually only set in response to actions made by you which amount to a request for services, such as signing a document or verifying your identity.',
    alwaysActive: true,
  },
  {
    id: 'functional',
    title: 'Functional Cookies',
    description:
      'These cookies enable the website to provide enhanced functionality and personalization during your signing session, such as remembering UI preferences.',
  },
  {
    id: 'marketing',
    title: 'Targeting Cookies',
    description:
      'These cookies may be set through our site by our advertising partners. They may be used to build a profile of your interests and show you relevant content on other sites.',
  },
  {
    id: 'performance',
    title: 'Performance Cookies',
    description:
      'These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site. They help us know which pages are the most and least popular.',
  },
];

export const CookiePreferenceCenter: React.FC<CookiePreferenceCenterProps> = ({
  open,
  onClose,
}) => {
  const [prefs, setPrefs] = useState<CookiePreferences>(() =>
    readCookiePreferences() || {
      essential: true,
      performance: false,
      functional: false,
      marketing: false,
      updatedAt: new Date().toISOString(),
    },
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    essential: true,
    functional: false,
    marketing: false,
    performance: false,
  });

  useEffect(() => {
    if (!open) return;
    setPrefs(
      readCookiePreferences() || {
        essential: true,
        performance: false,
        functional: false,
        marketing: false,
        updatedAt: new Date().toISOString(),
      },
    );
  }, [open]);

  if (!open) return null;

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const confirm = () => {
    saveCookiePreferences({ ...prefs, essential: true });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col rounded-lg bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preference-title"
      >
        <div className="border-b border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <h2 id="cookie-preference-title" className="text-xl font-semibold text-gray-900">
              Privacy Preference Center
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close cookie preferences"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            When you visit any website, it may store or retrieve information on your browser, mostly
            in the form of cookies. Because we respect your right to privacy, you can choose not to
            allow some types of cookies.{' '}
            <Link to="/cookie-policy" className="font-medium text-[#248567] underline">
              More information
            </Link>
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <p className="mb-3 text-sm font-semibold text-gray-900">Manage Consent Preferences</p>

          <div className="divide-y divide-gray-200 border border-gray-200">
            {COOKIE_CATEGORIES.map((category) => {
              const isOpen = !!expanded[category.id];
              const isAlwaysActive = category.alwaysActive || category.id === 'essential';

              return (
                <div key={category.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(category.id)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-gray-500">
                      {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-semibold text-gray-900">
                      {category.title}
                    </span>
                    {isAlwaysActive ? (
                      <span className="shrink-0 text-xs font-bold text-[#248567]">Always Active</span>
                    ) : (
                      <label
                        className="relative inline-flex shrink-0 cursor-pointer items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={!!prefs[category.id]}
                          onChange={(e) =>
                            setPrefs((prev) => ({ ...prev, [category.id]: e.target.checked }))
                          }
                          className="h-4 w-4 rounded border-gray-300 accent-[#248567]"
                        />
                      </label>
                    )}
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
                      <p className="text-sm leading-relaxed text-gray-600">{category.description}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            onClick={confirm}
            className="rounded bg-[#248567] px-8 py-2.5 text-sm font-semibold text-white hover:bg-[#1f7158]"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

type CookieConsentBannerProps = {
  onManage: () => void;
};

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({ onManage }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!readCookiePreferences());
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] p-4">
      <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          We use cookies to secure your signing session and improve {APP_NAME}. You can manage
          preferences anytime.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onManage}
            className="rounded border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Manage
          </button>
          <button
            type="button"
            onClick={() => {
              acceptAllCookiePreferences();
              setVisible(false);
            }}
            className="rounded bg-[#248567] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1f7158]"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferenceCenter;
