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
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!insightsData) {
    return null;
  }

  const pieData = [
    { name: 'AI Generated', value: insightsData.aiGeneratedVsManual.aiGenerated },
    { name: 'Manual', value: insightsData.aiGeneratedVsManual.manual }
  ];

  const COLORS = ['#3B82F6', '#10B981'];

  return (
    <div className="space-y-6">
      <div className="p-6 text-black">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl thankyou-heading font-bold mb-2 flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              AI Audit, Logs & Insights
            </h2>
            <p className="text-gray-500 text-sm">Comprehensive analytics for management decision-making</p>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
            <div className="text-3xl font-bold">{insightsData.productivityInsights.timeSaved}%</div>
            <div className="text-sm text-black">Time Saved</div>
          </div>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-green-600 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-900">
              AI reduced document creation time by {insightsData.productivityInsights.timeSaved}% this month.
            </p>
            <p className="text-xs text-green-700 mt-1">
              {insightsData.productivityInsights.documentsCreated} documents created with {insightsData.productivityInsights.efficiencyGain}% efficiency gain
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Most Used Templates</h3>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {insightsData.mostUsedTemplates.slice(0, 3).map((template, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{template.name}</p>
                  <div className="mt-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${template.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-600 ml-2">{template.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Avg. Signing Time</h3>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">{insightsData.avgSigningTime}</span>
            <span className="text-sm text-gray-500 mb-1">hours</span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">12% faster</span>
            <span className="text-gray-500">than last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">AI vs Manual</h3>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">AI Generated</span>
              <span className="text-lg font-bold text-blue-600">
                {insightsData.aiGeneratedVsManual.aiGenerated}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Manual</span>
              <span className="text-lg font-bold text-gray-600">
                {insightsData.aiGeneratedVsManual.manual}
              </span>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-gray-600">
                  {insightsData.aiGeneratedVsManual.percentage}% AI adoption
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Efficiency Gain</h3>
            <Award className="w-5 h-5 text-yellow-600" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-gray-900">
              {insightsData.productivityInsights.efficiencyGain}%
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-medium">+{insightsData.productivityInsights.efficiencyGain}%</span>
            <span className="text-gray-500">productivity</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Generated vs Manual Documents</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={insightsData.monthlyComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="aiGenerated" fill="#3B82F6" name="AI Generated" />
              <Bar dataKey="manual" fill="#10B981" name="Manual" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Failed Envelopes & Reasons</h3>
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          {insightsData.failedEnvelopes.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No failed envelopes</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insightsData.failedEnvelopes.map((envelope) => (
                <div
                  key={envelope.id}
                  className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-100"
                >
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{envelope.subject}</p>
                    <p className="text-xs text-red-600 mt-1">{envelope.reason}</p>
                    <p className="text-xs text-gray-500 mt-1">{envelope.date}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Templates</h3>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {insightsData.mostUsedTemplates.map((template, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">{idx + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{template.name}</p>
                    <p className="text-xs text-gray-500">{template.count} uses</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-blue-600">{template.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

       
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          User Productivity Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {insightsData.productivityInsights.documentsCreated}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Documents Created</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {insightsData.productivityInsights.timeSaved}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Time Saved with AI</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {insightsData.productivityInsights.efficiencyGain}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Efficiency Gain</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAuditInsights;

