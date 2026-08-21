import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';
import { apiGateway } from '../../services/apiHelper';
import toast from 'react-hot-toast';
import { PageShell, PageHero, PagePanel } from '../../components/common/PageShell';

interface Notification {
  _id: string;
  id:string;
  userId: string;
  source: string;
  metadata: {
              envelopeId: {
                  _id: string,
                  subject: string,
                  status: string
              },
              recipientId:string
              redirectUrl:string
            }
  envelopeSubject: string;
  type: 'signature_completed' | 'envelope_completed' | 'reminder' | 'document_comment' | 'ORG_INVITATION';
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiGateway.get('/get-notifications');
      if (response.data?.status === 'success') {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string, source: string) => {
    try {
      await apiGateway.post(`/mark-read/${notificationId}`,{
        source:source
      });
      setNotifications(prev =>
        prev.map(n => n._id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiGateway.post('/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const getNotificationTarget = (notification: Notification) => {
    const envelopeId =
      typeof notification?.metadata?.envelopeId === 'object'
        ? notification.metadata.envelopeId?._id
        : notification?.metadata?.envelopeId || (notification as any)?.envelopeId?._id || (notification as any)?.envelopeId;

    if (notification?.type === 'ORG_INVITATION') {
      return notification?.metadata?.redirectUrl || null;
    }
    if (notification?.type === 'document_comment' && envelopeId) {
      return `/e-sign/envelope/${envelopeId}?section=comments`;
    }
    if (envelopeId) {
      return `/e-sign/envelope/${envelopeId}`;
    }
    return null;
  };

  const handleNotificationClick = async(notification: Notification) => {
    if (!notification.isRead) {
      await handleMarkAsRead(notification?._id || notification?.id, notification?.source);
    }
    const target = getNotificationTarget(notification);
    if (!target) return;
    if (target.startsWith('http')) {
      window.location.href = target;
    } else {
      navigate(target);
    }
  };

  const formatNotificationTime = (date: string) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'signature_completed':
        return '✓';
      case 'envelope_completed':
        return '✓✓';
      case 'reminder':
        return '⏰';
      case 'document_comment':
        return '💬';
      case 'ORG_INVITATION':
        return '🏢'
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'signature_completed':
        return 'bg-emerald-100 text-emerald-700';
      case 'envelope_completed':
        return 'bg-primary/10 text-primary';
      case 'reminder':
        return 'bg-amber-100 text-amber-700';
      case 'document_comment':
        return 'bg-[#260559]/10 text-[#260559]';
      case 'ORG_INVITATION':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  return (
    <PageShell wide>
      <PageHero
        compact
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
        backTo="/dashboard"
        action={
          unreadCount > 0 ? (
            <button
              onClick={handleMarkAllAsRead}
              className="dm-btn-primary bg-white text-[#155E4B] hover:bg-white/90"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          ) : undefined
        }
      />

      <div className="dm-filter-tabs w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`dm-filter-tab ${filter === 'all' ? 'dm-filter-tab--active' : ''}`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`dm-filter-tab ${filter === 'unread' ? 'dm-filter-tab--active' : ''}`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      <PagePanel noPadding bodyClassName="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="dm-empty m-4">
            <Bell className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="font-medium text-foreground">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {filter === 'unread'
                ? "You're all caught up!"
                : "You'll see notifications here when recipients sign your documents."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/70">
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className={`cursor-pointer px-5 py-4 transition hover:bg-muted/30 ${!notification.isRead ? 'bg-primary/[0.04]' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-semibold ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                          {notification.message}
                        </p>
                        {notification.envelopeSubject && (
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {notification.envelopeSubject}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatNotificationTime(notification.createdAt)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-3">
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification._id || notification.id, notification.source);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                        >
                          <Check className="h-3 w-3" />
                          Mark read
                        </button>
                      )}
                      {getNotificationTarget(notification) && (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="h-3 w-3" />
                          Open
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </PagePanel>
    </PageShell>
  );
};

export default NotificationsPage;
