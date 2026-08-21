import React from 'react';
import { PageShell, PageHero, PagePanel } from '../../components/common/PageShell';

const CompliancePage: React.FC = () => {
  return (
    <PageShell wide>
      <PageHero
        compact
        title="Compliance"
        subtitle="Monitor compliance status and requirements"
        backTo="/dashboard"
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {[
          { label: 'Compliant', value: '85%', emoji: '✅', tone: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending Review', value: '12%', emoji: '⚠️', tone: 'text-amber-600 bg-amber-50' },
          { label: 'Non-Compliant', value: '3%', emoji: '❌', tone: 'text-red-600 bg-red-50' },
        ].map((stat) => (
          <div key={stat.label} className="dm-stat-tile">
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.tone}`}>
                <span className="text-2xl">{stat.emoji}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <PagePanel title="Compliance Checklist" noPadding bodyClassName="divide-y divide-border/70">
        {[
          { name: 'Data Encryption', status: 'Compliant', ok: true },
          { name: 'Access Controls', status: 'Compliant', ok: true },
          { name: 'Audit Logging', status: 'Pending Review', ok: false },
        ].map((item) => (
          <div key={item.name} className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <span>{item.ok ? '✅' : '⚠️'}</span>
              <span className="text-sm font-medium text-foreground">{item.name}</span>
            </div>
            <span className={`text-sm font-medium ${item.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
              {item.status}
            </span>
          </div>
        ))}
      </PagePanel>
    </PageShell>
  );
};

export default CompliancePage;
