import React, { useEffect, useState } from 'react';
import { Gift, X } from 'lucide-react';

const POP_INTERVAL_MS = 60_000;
const POP_DURATION_MS = 2500;

const GiftWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPopping, setIsPopping] = useState(false);

  useEffect(() => {
    const triggerPop = () => {
      setIsPopping(true);
      window.setTimeout(() => setIsPopping(false), POP_DURATION_MS);
    };

    triggerPop();
    const intervalId = window.setInterval(triggerPop, POP_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <div className="fixed bottom-6 left-4 md:left-6 z-40 pointer-events-none">
      {/* Info card */}
      {isOpen && (
        <div className="mb-3 max-w-xs rounded-2xl bg-white shadow-xl border border-purple-100 p-4 pointer-events-auto">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-[#4D0080]">
              <Gift className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">New rewards & tips</p>
              <p className="mt-1 text-xs text-gray-600">
                Explore shortcuts, credits, and best practices to get more value from Draft &amp; Sign.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ml-1 text-gray-400 hover:text-gray-600"
              aria-label="Close gift widget"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#4D0080] text-white shadow-lg border border-purple-300 hover:bg-[#3a0061] transition-transform ${
          isPopping ? 'animate-bounce' : ''
        }`}
        aria-label="Open rewards & tips"
      >
        <Gift className="h-6 w-6" />
      </button>
    </div>
  );
};

export default GiftWidget;

