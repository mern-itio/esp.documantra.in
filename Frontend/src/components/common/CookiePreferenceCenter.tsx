import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Settings2, X } from 'lucide-react';
import {
  acceptAllCookiePreferences,
  readCookiePreferences,
  rejectNonEssentialCookiePreferences,
  saveCookiePreferences,
  type CookiePreferences,
} from '../../utils/cookiePreferences';
import { APP_NAME } from '../../config/brand';

type CookiePreferenceCenterProps = {
  open: boolean;
  onClose: () => void;
};

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

  const save = () => {
    saveCookiePreferences(prefs);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-preference-title"
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[#4D0080]">
              <Settings2 className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Privacy</span>
            </div>
            <h2 id="cookie-preference-title" className="mt-1 text-lg font-semibold text-gray-900">
              Cookie Preference Center
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100"
            aria-label="Close cookie preferences"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[60vh] space-y-4 overflow-auto px-5 py-4 text-sm text-gray-600">
          <p>
            {APP_NAME} uses cookies to secure signing sessions, remember preferences, and improve
            performance. You can update your choices at any time.
          </p>

          <label className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <div>
              <p className="font-semibold text-gray-900">Essential</p>
              <p className="mt-1 text-xs text-gray-500">Required for signing, security, and core features.</p>
            </div>
            <span className="text-xs font-semibold text-gray-500">Always on</span>
          </label>

          <label className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="font-semibold text-gray-900">Performance</p>
              <p className="mt-1 text-xs text-gray-500">Helps us measure reliability and errors.</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.performance}
              onChange={(e) => setPrefs((prev) => ({ ...prev, performance: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#4D0080] focus:ring-[#4D0080]"
            />
          </label>

          <label className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="font-semibold text-gray-900">Functional</p>
              <p className="mt-1 text-xs text-gray-500">Remembers UI preferences during signing.</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.functional}
              onChange={(e) => setPrefs((prev) => ({ ...prev, functional: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#4D0080] focus:ring-[#4D0080]"
            />
          </label>

          <label className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="font-semibold text-gray-900">Marketing</p>
              <p className="mt-1 text-xs text-gray-500">Used for campaign measurement when enabled.</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={(e) => setPrefs((prev) => ({ ...prev, marketing: e.target.checked }))}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-[#4D0080] focus:ring-[#4D0080]"
            />
          </label>

          <p className="text-xs text-gray-500">
            Read our{' '}
            <Link to="/cookie-policy" className="font-medium text-[#4D0080] underline">
              Cookie Policy
            </Link>{' '}
            for more detail.
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              rejectNonEssentialCookiePreferences();
              onClose();
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={() => {
              acceptAllCookiePreferences();
              onClose();
            }}
            className="rounded-lg border border-[#4D0080] px-4 py-2 text-sm font-semibold text-[#4D0080] hover:bg-[#4D0080]/5"
          >
            Accept all
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-lg bg-[#4D0080] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3d0066]"
          >
            Save preferences
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
      <div className="pointer-events-auto mx-auto flex max-w-4xl flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-700">
          We use cookies to secure your signing session and improve {APP_NAME}. You can manage
          preferences anytime.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onManage}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Manage
          </button>
          <button
            type="button"
            onClick={() => {
              acceptAllCookiePreferences();
              setVisible(false);
            }}
            className="rounded-lg bg-[#4D0080] px-3 py-2 text-sm font-semibold text-white hover:bg-[#3d0066]"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferenceCenter;
