import React, { useEffect, useState } from 'react';
import { Coins } from 'lucide-react';
import { SubscriptionStorage } from '../../services/subscriptionService';

export const CostHeader: React.FC = () => {
  const [credits, setCredits] = useState<number>(() => SubscriptionStorage.getPlan()?.creditsBalance ?? 0);
  const [required, setRequired] = useState<number>(0);

  // Compute required credits for current tool from cached plan and tool map
  useEffect(() => {
    try {
      const plan: any = SubscriptionStorage.getPlan();
      const mapRaw = localStorage.getItem('toolCatalogIdMap');
      let toolObjId: string | null = null;
      const path = window.location.pathname;
      const slug = path.startsWith('/pdf-tools/') ? path.replace('/pdf-tools/', '').split('/')[0] : null;
      if (slug && mapRaw) {
        const map = JSON.parse(mapRaw || '{}');
        toolObjId = map[slug] || null;
      }
      const cost = toolObjId ? (plan?.toolCosts || []).find((tc: any) => String(tc.toolId) === String(toolObjId))?.credits || 0 : 0;
      setRequired(Number(cost || 0));
      setCredits(plan?.creditsBalance ?? 0);
    } catch {}
  }, [typeof window !== 'undefined' ? window.location.pathname : '']);

  // Listen for credits updates after operations
  useEffect(() => {
    const handler = () => {
      try { setCredits(SubscriptionStorage.getPlan()?.creditsBalance ?? 0); } catch {}
    };
    window.addEventListener('storage', handler);
    const interval = setInterval(handler, 1500);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  return (
    <header className="bg-background border-b border-border py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-muted px-3 py-1 rounded-full border border-border">
            <span className="text-xs font-medium text-foreground flex items-center">
              <Coins className="w-3.5 h-3.5 mr-1" />
              Operation cost: {required} credits
            </span>
          </div>
          <div className="bg-muted px-3 py-1 rounded-full border border-border">
            <span className="text-xs font-medium text-foreground">
              Current balance: {credits} credits
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default CostHeader;


