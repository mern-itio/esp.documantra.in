import { useState, useEffect } from 'react';
import { Bell, X, MessageCircle, AtSign, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDate } from '../../common/lib/utils';

interface MentionNotification {
  id: string;
  type: 'mention' | 'comment_reply' | 'document_shared' | 'workflow_assigned';
  documentId: string;
  documentName: string;
  fromUser: {
    name: string;
    email: string;
    avatar: string;
  };
  content: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface MentionNotifierProps {
  notifications: MentionNotification[];
  onMarkAsRead: (notificationId: string) => void;
  onMarkAllAsRead: () => void;
  onNavigateToMention: (notification: MentionNotification) => void;
}

const mockNotifications: MentionNotification[] = [
  {
    id: 'notif-1',
    type: 'mention',
    documentId: 'doc-1',
    documentName: 'Financial Report Q4.pdf',
    fromUser: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    content: '@jane.smith please review the revenue projections in section 3',
    timestamp: '2024-07-01T14:30:00Z',
    read: false
  },
  {
    id: 'notif-2',
    type: 'comment_reply',
    documentId: 'doc-2',
    documentName: 'Contract Agreement.docx',
    fromUser: {
      name: 'Mike Johnson',
      email: 'mike.johnson@example.com',
      avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    content: 'I agree with your suggestions. Let\'s schedule a meeting to discuss.',
    timestamp: '2024-07-01T13:45:00Z',
    read: false
  },
  {
    id: 'notif-3',
    type: 'workflow_assigned',
    documentId: 'doc-3',
    documentName: 'Legal Review Document.pdf',
    fromUser: {
      name: 'Sarah Wilson',
      email: 'sarah.wilson@example.com',
      avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=64&h=64&fit=crop'
    },
    content: 'You have been assigned to the Legal Review workflow step',
    timestamp: '2024-07-01T12:20:00Z',
    read: true
  }
];

export function MentionNotifier({
  notifications = mockNotifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onNavigateToMention
}: MentionNotifierProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'mention':
        return <AtSign className="w-4 h-4 text-blue-600" />;
      case 'comment_reply':
        return <MessageCircle className="w-4 h-4 text-green-600" />;
      case 'document_shared':
        return <Bell className="w-4 h-4 text-purple-600" />;
      case 'workflow_assigned':
        return <Bell className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'mention':
        return 'Mentioned you';
      case 'comment_reply':
        return 'Replied to your comment';
      case 'document_shared':
        return 'Shared a document';
      case 'workflow_assigned':
        return 'Assigned you to workflow';
      default:
        return 'Notification';
    }
  };

  const handleNotificationClick = (notification: MentionNotification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    onNavigateToMention(notification);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative h-8 w-8 p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notifications Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications ({unreadCount} unread)
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllAsRead}
                  className="text-xs h-6 px-2"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <img
                      src={notification.fromUser.avatar}
                      alt={notification.fromUser.name}
                      className="w-8 h-8 rounded-full flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getNotificationIcon(notification.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {notification.fromUser.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          {getNotificationTitle(notification.type)}
                        </span>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-700 mb-1 line-clamp-2">
                        {notification.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          in {notification.documentName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}