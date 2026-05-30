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
  details?: unknown;
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
  // documentId, 
  activities = mockActivities, 
  showUserAvatars = true, 
  maxItems = 10 
}: ActivityFeedProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'version':
        return <GitBranch className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'upload':
        return <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'download':
        return <Download className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'share':
        return <Share2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-muted-foreground" />;
      case 'approval':
        return <CheckCircle className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />;
      case 'workflow':
        return <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const displayedActivities = activities.slice(0, maxItems);

  return (
    <div className="bg-card text-card-foreground rounded-lg border border-border">
      <div className="p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
      </div>
      
      <div className="divide-y divide-border">
        {displayedActivities.length === 0 ? (
          <div className="p-6 text-center">
            <Clock className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-muted-foreground">No recent activity</p>
          </div>
        ) : (
          displayedActivities.map((activity) => (
            <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-start space-x-3">
                {showUserAvatars && (
                  <img
                    src={activity.user.avatar}
                    alt={activity.user.name}
                    className="w-8 h-8 rounded-full flex-shrink-0"
                  />
                )}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1 flex-wrap">
                    {getActivityIcon(activity.type)}
                    <span className="text-sm font-medium text-foreground">
                      {activity.user.name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {activity.action}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {activity.target}
                    </span>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    {formatDate(activity.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {activities.length > maxItems && (
        <div className="p-4 border-t border-border text-center">
          <button type="button" className="text-sm text-primary hover:text-primary/80 font-medium">
            View all activity ({activities.length} total)
          </button>
        </div>
      )}
    </div>
  );
}