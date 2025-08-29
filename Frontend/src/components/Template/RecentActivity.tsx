import React from 'react';
import { FileText, FormInput, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export const RecentActivity: React.FC = () => {
  const activities = [
    {
      type: 'template_created',
      title: 'Employment Contract Template created',
      description: 'Created by Sarah Johnson in HR Documents',
      timestamp: '2 hours ago',
      icon: FileText,
      color: 'bg-blue-100 text-blue-600'
    },
    {
      type: 'form_completed',
      title: 'Sales Proposal form completed',
      description: '32 responses received this week',
      timestamp: '4 hours ago',
      icon: FormInput,
      color: 'bg-green-100 text-green-600'
    },
    {
      type: 'team_added',
      title: 'New team member added',
      description: 'Mike Chen joined the Legal Team',
      timestamp: '6 hours ago',
      icon: Users,
      color: 'bg-purple-100 text-purple-600'
    },
    {
      type: 'template_approved',
      title: 'NDA Template approved',
      description: 'Template ready for production use',
      timestamp: '8 hours ago',
      icon: CheckCircle,
      color: 'bg-emerald-100 text-emerald-600'
    },
    {
      type: 'automation_triggered',
      title: 'Automation workflow triggered',
      description: 'Vendor Agreement processing completed',
      timestamp: '12 hours ago',
      icon: Clock,
      color: 'bg-orange-100 text-orange-600'
    },
    {
      type: 'template_issue',
      title: 'Template validation warning',
      description: 'Invoice Template requires review',
      timestamp: '1 day ago',
      icon: AlertCircle,
      color: 'bg-red-100 text-red-600'
    }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Recent Activity</h2>
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={index} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${activity.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-6 pt-4 border-t border-gray-100">
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View all activity
        </button>
      </div>
    </div>
  );
};