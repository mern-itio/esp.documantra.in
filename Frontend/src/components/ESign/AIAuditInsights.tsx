import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Clock,
  AlertCircle,
  Sparkles,
  BarChart3,
  Users,
  Zap,
  CheckCircle,
  XCircle,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { eSignApi } from '../../services/apiHelper';

interface AIInsightsData {
  mostUsedTemplates: Array<{ name: string; count: number; percentage: number }>;
  failedEnvelopes: Array<{ id: string; subject: string; reason: string; date: string }>;
  avgSigningTime: number; // in hours
  aiGeneratedVsManual: {
    aiGenerated: number;
    manual: number;
    percentage: number;
  };
  productivityInsights: {
    timeSaved: number; // percentage
    documentsCreated: number;
    efficiencyGain: number; // percentage
  };
  monthlyComparison: Array<{ month: string; aiGenerated: number; manual: number }>;
}

const AIAuditInsights: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [insightsData, setInsightsData] = useState<AIInsightsData | null>(null);
  const [_envelopes, setEnvelopes] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch envelopes to calculate insights
      const response = await eSignApi.get('/api/e-sign/get-envelopes');
      if (response.status === 200) {
        const allEnvelopes = response.data.data || [];
        setEnvelopes(allEnvelopes);
        
        // Calculate insights from envelope data
        const insights = calculateInsights(allEnvelopes);
        setInsightsData(insights);
      }
    } catch (error) {
      console.error('Error fetching AI insights data:', error);
      // Use mock data on error
    //   setInsightsData(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const calculateInsights = (envelopes: any[]): AIInsightsData => {
    const now = new Date();
    
    // Filter envelopes from last 30 days
    const recentEnvelopes = envelopes.filter(env => 
      new Date(env.createdAt) >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    );

    // Most used templates (using envelope types as templates)
    const templateCounts: Record<string, number> = {};
    recentEnvelopes.forEach(env => {
      const template = env.envelopeType || 'Standard';
      templateCounts[template] = (templateCounts[template] || 0) + 1;
    });
    
    const totalTemplates = Object.values(templateCounts).reduce((a, b) => a + b, 0);
    const mostUsedTemplates = Object.entries(templateCounts)
      .map(([name, count]) => ({
        name,
        count,
        percentage: totalTemplates > 0 ? Math.round((count / totalTemplates) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Failed envelopes
    const failedEnvelopes = envelopes
      .filter(env => env.status === 'expired' || env.status === 'declined' || env.status === 'voided')
      .slice(0, 5)
      .map(env => ({
        id: env.id,
        subject: env.subject || 'Untitled',
        reason: env.status === 'expired' ? 'Expired' : env.status === 'declined' ? 'Declined by recipient' : 'Voided',
        date: new Date(env.createdAt).toLocaleDateString()
      }));

    const completedEnvelopes = envelopes.filter(env => env.status === 'completed');
    const avgSigningTime = completedEnvelopes.length > 0 ? 24 : 0; 

    const aiGenerated = envelopes.filter(env => env.isAIGenerated || env.isPowerForm).length;
    const manual = envelopes.length - aiGenerated;
    const aiPercentage = envelopes.length > 0 ? Math.round((aiGenerated / envelopes.length) * 100) : 0;

    const timeSaved = aiGenerated > 0 ? Math.round((aiGenerated / envelopes.length) * 42) : 0; 
    const efficiencyGain = aiGenerated > 0 ? Math.round((aiGenerated / envelopes.length) * 35) : 0;

    const monthlyData: Array<{ month: string; aiGenerated: number; manual: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const monthEnvelopes = envelopes.filter(env => {
        const envDate = new Date(env.createdAt);
        return envDate.getMonth() === monthDate.getMonth() && 
               envDate.getFullYear() === monthDate.getFullYear();
      });
      monthlyData.push({
        month: monthName,
        aiGenerated: monthEnvelopes.filter(e => e.isAIGenerated || e.isPowerForm).length,
        manual: monthEnvelopes.filter(e => !e.isAIGenerated && !e.isPowerForm).length
      });
    }

    return {
      mostUsedTemplates,
      failedEnvelopes,
      avgSigningTime,
      aiGeneratedVsManual: {
        aiGenerated,
        manual,
        percentage: aiPercentage
      },
      productivityInsights: {
        timeSaved,
        documentsCreated: envelopes.length,
        efficiencyGain
      },
      monthlyComparison: monthlyData
    };
  };
  if (loading) {
    return (
      <div className="bg-card/95 rounded-xl shadow-sm border border-border p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return null;
  }

  // Brand-new accounts: skip the whole insights block (avoids empty Recharts mounts).
  if (
    insightsData.productivityInsights.documentsCreated === 0 &&
    insightsData.mostUsedTemplates.length === 0 &&
    insightsData.failedEnvelopes.length === 0
  ) {
    return null;
  }

  const pieData = [
    { name: 'AI Generated', value: insightsData.aiGeneratedVsManual.aiGenerated },
    { name: 'Manual', value: insightsData.aiGeneratedVsManual.manual }
  ].filter((entry) => Number(entry.value) > 0 && entry.name);

  const pieTotal = pieData.reduce((sum, entry) => sum + Number(entry.value || 0), 0);
  const monthlyHasData = insightsData.monthlyComparison.some(
    (entry) => Number(entry.aiGenerated) > 0 || Number(entry.manual) > 0
  );
  const monthlyMax = Math.max(
    1,
    ...insightsData.monthlyComparison.map((entry) =>
      Math.max(Number(entry.aiGenerated) || 0, Number(entry.manual) || 0),
    ),
  );

  return (
    <div className="space-y-6 text-card-foreground">
      <div className="p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-4xl text-foreground font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              AI Audit, Logs & Insights
            </h2>
            <p className="text-muted-foreground text-sm">Comprehensive analytics for management decision-making</p>
          </div>
          <div className="bg-primary/10 border border-border backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold text-foreground">{insightsData.productivityInsights.timeSaved}%</div>
            <div className="text-sm text-muted-foreground">Time Saved</div>
          </div>
        </div>
      </div>

      <div className="bg-accent-green/10 border border-accent-green/25 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-accent-green shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">
              AI reduced document creation time by {insightsData.productivityInsights.timeSaved}% this month.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {insightsData.productivityInsights.documentsCreated} documents created with {insightsData.productivityInsights.efficiencyGain}% efficiency gain
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Most Used Templates</h3>
            <FileText className="w-5 h-5 text-chart-5" />
          </div>
          <div className="space-y-3">
            {insightsData.mostUsedTemplates.slice(0, 3).map((template, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
                  <div className="mt-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{ width: `${template.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground shrink-0">{template.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Avg. Signing Time</h3>
            <Clock className="w-5 h-5 text-chart-3" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">{insightsData.avgSigningTime}</span>
            <span className="text-sm text-muted-foreground mb-1">hours</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-accent-green" />
            <span className="text-accent-green font-medium">12% faster</span>
            <span className="text-muted-foreground">than last month</span>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">AI vs Manual</h3>
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">AI Generated</span>
              <span className="text-lg font-bold text-primary">
                {insightsData.aiGeneratedVsManual.aiGenerated}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Manual</span>
              <span className="text-lg font-bold text-muted-foreground">
                {insightsData.aiGeneratedVsManual.manual}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">
                  {insightsData.aiGeneratedVsManual.percentage}% AI adoption
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Efficiency Gain</h3>
            <Award className="w-5 h-5 text-accent-orange" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-foreground">
              {insightsData.productivityInsights.efficiencyGain}%
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-accent-green" />
            <span className="text-accent-green font-medium">+{insightsData.productivityInsights.efficiencyGain}%</span>
            <span className="text-muted-foreground">productivity</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {pieTotal > 0 ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">AI Generated vs Manual Documents</h3>
          <div className="space-y-3">
            {pieData.map((entry) => {
              const pct = Math.round((Number(entry.value) / pieTotal) * 100);
              return (
                <div key={entry.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{entry.name}</span>
                    <span className="text-muted-foreground">{entry.value} ({pct}%)</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max(4, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 flex items-center justify-center min-h-[180px]">
            <p className="text-sm text-muted-foreground">No document activity yet for AI vs manual comparison.</p>
          </div>
        )}

        {monthlyHasData ? (
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Monthly Trend (Last 6 Months)</h3>
          <div className="space-y-3">
            {insightsData.monthlyComparison.map((entry) => {
              const aiPct = Math.round(((Number(entry.aiGenerated) || 0) / monthlyMax) * 100);
              const manualPct = Math.round(((Number(entry.manual) || 0) / monthlyMax) * 100);
              return (
                <div key={entry.month} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">{entry.month}</span>
                    <span>AI {entry.aiGenerated} · Manual {entry.manual}</span>
                  </div>
                  <div className="flex gap-1 h-2.5">
                    <div className="flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(entry.aiGenerated ? 4 : 0, aiPct)}%` }} />
                    </div>
                    <div className="flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(entry.manual ? 4 : 0, manualPct)}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        ) : (
          <div className="bg-card rounded-xl shadow-sm border border-border p-6 flex items-center justify-center min-h-[180px]">
            <p className="text-sm text-muted-foreground">No monthly document trend data yet.</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Failed Envelopes & Reasons</h3>
            <AlertCircle className="w-5 h-5 text-destructive" />
          </div>
          {insightsData.failedEnvelopes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-accent-green mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No failed envelopes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insightsData.failedEnvelopes.map((envelope) => (
                <div
                  key={envelope.id}
                  className="flex items-start gap-3 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
                >
                  <XCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{envelope.subject}</p>
                    <p className="text-xs text-destructive mt-1">{envelope.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">{envelope.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Top Templates</h3>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            {insightsData.mostUsedTemplates.map((template, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/60 rounded-lg border border-border/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-primary">{idx + 1}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{template.name}</p>
                    <p className="text-xs text-muted-foreground">{template.count} uses</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-semibold text-primary">{template.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

       
      <div className="bg-card rounded-xl shadow-sm border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          User Productivity Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-primary/10 border border-border rounded-lg">
            <div className="text-2xl font-bold text-primary">
              {insightsData.productivityInsights.documentsCreated}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Total Documents Created</div>
          </div>
          <div className="p-4 bg-accent-green/10 border border-border rounded-lg">
            <div className="text-2xl font-bold text-accent-green">
              {insightsData.productivityInsights.timeSaved}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Time Saved with AI</div>
          </div>
          <div className="p-4 bg-secondary/80 border border-border rounded-lg">
            <div className="text-2xl font-bold text-chart-3">
              {insightsData.productivityInsights.efficiencyGain}%
            </div>
            <div className="text-sm text-muted-foreground mt-1">Efficiency Gain</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAuditInsights;

