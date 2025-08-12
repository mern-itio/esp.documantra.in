import React from 'react';
import { 
  MessageCircle, 
  GitBranch, 
  Upload, 
  Download, 
  Share2, 
  Edit3,
  CheckCircle,
  Clock,
  User
} from 'lucide-react';
import { formatDate } from '../../common/lib/utils';

interface ActivityItem {
  id: string;
  type: 'comment' | 'version' | 'upload' | 'download' | 'share' | 'edit' | 'approval' | 'workflow';
  user: {
    name: string;
    email: string;
    avatar: string;
  };
  action: string;
  target: string;
  timestamp: string;
  details?: any;
}

interface ActivityFeedProps {
  documentId?: string;
  activities: ActivityItem[];
  showUserAvatars?: boolean;
  maxItems?: number;
}

const mockActivities: ActivityItem[] = [
  {
    id: 'activity-1',
    type: 'comment',
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    action: 'added a comment',
    target: 'Financial Projections section',
    timestamp: '2024-07-01T14:30:00Z'
  },
  {
    id: 'activity-2',
    type: 'version',
    user: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    action: 'created version',
    target: 'v1.3',
    timestamp: '2024-07-01T13:45:00Z'
  },
  {
    id: 'activity-3',
    type: 'edit',
    user: {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    action: 'edited document',
    target: 'Executive Summary',
    timestamp: '2024-07-01T12:20:00Z'
  },
  {
    id: 'activity-4',
    type: 'approval',
    user: {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    action: 'approved workflow step',
    target: 'Legal Review',
    timestamp: '2024-07-01T11:15:00Z'
  },
  {
    id: 'activity-5',
    type: 'share',
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    action: 'shared document with',
    target: 'legal@example.com',
    timestamp: '2024-07-01T10:30:00Z'
  }
];

export function ActivityFeed({ 
  documentId, 
  activities = mockActivities, 
  showUserAvatars = true, 
  maxItems = 10 
}: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-600" />;
      case 'version':
        return <GitBranch className="w-4 h-4 text-green-600" />;
      case 'upload':
        return <Upload className="w-4 h-4 text-purple-600" />;
      case 'download':
        return <Download className="w-4 h-4 text-orange-600" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-blue-500" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-gray-600" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'workflow':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {displayedActivities.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          displayedActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3">
                {showUserAvatars && (
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <span className="text-sm font-medium text-gray-900">
                      {activity.user.name}
                    </span>
                    <span className="text-sm text-gray-600">
                      {activity.action}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {activity.target}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > maxItems && (
        <div className="p-4 border-t border-gray-200 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all activity ({activities.length} total)
          </button>
        </div>
      )}
    </div>
  );
}