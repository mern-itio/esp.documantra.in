import React, { useState } from 'react';
import { useAuth } from '../AuthService/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { Bell, LogOut, Menu, Search, Crown, X, User, Building2, Mail, FileText, Gift, ArrowLeftRight, ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { SubscriptionStorage } from '../../services/subscriptionService';
import { subscriptionApi, organizationApi, apiGateway } from '../../services/apiHelper';
import Swal from 'sweetalert2';
import type { Organization } from '../../types/organization';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { isDark, toggle: toggleTheme } = useTheme();
  const [allOrganizations, setAllOrganizations] = React.useState<Organization[]>([]);
  const { user, logout, accountType, organizationId, switchAccount, organizationDetail } = useAuth();
  const [showSwitcher, setShowSwitcher] = useState(false);
  const { userPlan, isFreePlan } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();
  // Check if user has a paid plan
  const isPaidPlan = userPlan && !isFreePlan();

  const [showNotif, setShowNotif] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showPalette, setShowPalette] = React.useState(false);
  const [paletteQuery, setPaletteQuery] = React.useState('');
  const [credits, setCredits] = React.useState<number | null>(null);
  const [creditsLoading, setCreditsLoading] = React.useState(true);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [notificationsLoading, setNotificationsLoading] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement | null>(null);
  const userRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (showNotif && notifRef.current && !notifRef.current.contains(target)) setShowNotif(false);
      if (showUserMenu && userRef.current && !userRef.current.contains(target)) setShowUserMenu(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [showNotif, showUserMenu]);

  // Fetch credits from API (same approach as DashboardPage)
  const fetchCredits = React.useCallback(async () => {
    try {
      setCreditsLoading(true);
      const response = await subscriptionApi.get('/usage/balance');
      const balance = (response as any).data?.data?.creditsBalance ?? null;
      const n = Number(balance);
      setCredits(Number.isFinite(n) ? n : null);

      // Also update localStorage for consistency
      if (Number.isFinite(n)) {
        SubscriptionStorage.updateCredits(n);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
      // Fallback to localStorage/context if API fails
      try {
        const planFromContext: any = userPlan;
        const planFromStorage: any = SubscriptionStorage.getPlan();
        const raw = (planFromContext && planFromContext.creditsBalance != null)
          ? planFromContext.creditsBalance
          : planFromStorage?.creditsBalance;
        const n = Number(raw);
        setCredits(Number.isFinite(n) ? n : null);
      } catch {
        setCredits(null);
      }
    } finally {
      setCreditsLoading(false);
    }
  }, [userPlan]);

  // Fetch credits on mount and when user changes
  React.useEffect(() => {
    if (user) {
      fetchCredits();
    }
  }, [user, fetchCredits]);

  // Listen for custom events when credits are consumed
  React.useEffect(() => {
    const handleCreditsUpdated = () => {
      fetchCredits();
    };

    // Listen for custom event
    window.addEventListener('credits-updated', handleCreditsUpdated);
    // Also listen for storage events (for cross-tab updates)
    window.addEventListener('storage', handleCreditsUpdated);

    return () => {
      window.removeEventListener('credits-updated', handleCreditsUpdated);
      window.removeEventListener('storage', handleCreditsUpdated);
    };
  }, [fetchCredits]);

  // Listen for custom events when organizations are updated
  React.useEffect(() => {
    const handleOrganizationsUpdated = () => {
      fetchOrganizations();
    };

    window.addEventListener('organizations-updated', handleOrganizationsUpdated);

    return () => {
      window.removeEventListener('organizations-updated', handleOrganizationsUpdated);
    };
  }, []);

  // Fetch notifications
  const fetchNotifications = React.useCallback(async () => {
    if (!user) return;
    try {
      setNotificationsLoading(true);
      const response = await apiGateway.get('/api/get-notifications');
      if (response.data?.status === 'success') {
        setNotifications(response.data.data.notifications || []);
        setUnreadCount(response.data.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [user]);
  const fetchOrganizations = React.useCallback(async () => {
    try {
      const response = await organizationApi.get('/api/organization/user-organizations');
      const data = response.data?.data ?? response.data;
      setAllOrganizations(Array.isArray(data) ? data : data ? [data] : []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  }, []);

  // Fetch notifications on mount and when user changes
  React.useEffect(() => {
    if (user) {
      fetchOrganizations();
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications, fetchOrganizations]);
  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await apiGateway.post('api/mark-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Format notification time
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
    return notifDate.toLocaleDateString();
  };

  // Keyboard shortcut: Ctrl/Cmd+K to open command palette
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isCmdK = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k';
      if (isCmdK) {
        e.preventDefault();
        setShowPalette((s) => !s);
      }
      if (e.key === 'Escape') {
        setShowPalette(false);
        setShowNotif(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to log out?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#260559',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, log out',
      cancelButtonText: 'Cancel',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-xl',
        confirmButton: 'px-5 py-2.5 rounded-lg font-medium',
        cancelButton: 'px-5 py-2.5 rounded-lg font-medium'
      }
    });

    // Only proceed if user confirmed
    if (result.isConfirmed) {
      try {
        await logout();
        // Show success message briefly before navigating
        await Swal.fire({
          title: 'Logged out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          confirmButtonColor: '#260559',
          confirmButtonText: 'OK',
          timer: 1500,
          timerProgressBar: true,
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
          }
        });
      } catch (error) {
        console.error('Logout error:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to log out. Please try again.',
          icon: 'error',
          confirmButtonColor: '#DC2626',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'rounded-xl',
            confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
          }
        });
      } finally {
        navigate('/login');
      }
    }
  };

  const handleAccountSwitch = async (type: 'user' | 'organization', org?: Organization) => {
    try {
      if (type === 'organization' && org?._id) {
        await switchAccount('organization', org._id);
      } else {
        await switchAccount('user');
      }

      setShowSwitcher(false);
      setShowUserMenu(false);

      await Swal.fire({
        icon: 'success',
        title: type === 'organization' ? 'Switched to organization account' : 'Switched to main account',
        text: type === 'organization'
          ? `You are now using ${org?.name ?? 'the organization account'}.`
          : 'You are now using your main user account.',
        confirmButtonColor: '#260559',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
        }
      });
    } catch (error) {
      console.error('Switch account error:', error);
      Swal.fire({
        title: 'Unable to switch account',
        text: 'Please try again.',
        icon: 'error',
        confirmButtonColor: '#DC2626',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'rounded-xl',
          confirmButton: 'px-5 py-2.5 rounded-lg font-medium'
        }
      });
    }
  };

  const formatName = (name?: string) => {
    if (!name) return 'User';
    return name
      .trim()
      .split(/\s+/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(' ');
  };

  const paletteItems = React.useMemo(() => {
    const items = [
      { id: 'dashboard', label: 'Dashboard', action: () => navigate('/dashboard') },
      { id: 'new-envelope', label: 'New Envelope', action: () => navigate('/e-sign/create') },
      { id: 'manage-envelopes', label: 'Manage Envelopes', action: () => navigate('/e-sign/aggrement') },
      { id: 'credits-usage', label: 'Credits & Billing', action: () => navigate('/credits-usage') },
      { id: 'documents', label: 'Documents', action: () => navigate('/all-documents') },
      { id: 'pdf-tools', label: 'PDF Tools', action: () => navigate('/pdf-tools') },
    ];
    if (!paletteQuery.trim()) return items;
    const q = paletteQuery.toLowerCase();
    return items.filter(i => i.label.toLowerCase().includes(q));
  }, [paletteQuery, navigate]);

  const lowCredits = credits != null && credits <= 10;
  const getInitials = (fullName = "") => {
    const parts = fullName.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="bg-background shadow-sm border-b border-border text-foreground">
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="group p-2 rounded-lg hover:bg-muted transition-all duration-300 lg:hidden hover:scale-110 active:scale-95"
          >
            <Menu className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:rotate-90 transition-all duration-300" />
          </button>

          {/* Command palette trigger */}
          <button
            onClick={() => setShowPalette(true)}
            className="group hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:border-primary hover:bg-muted/80 text-muted-foreground transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-100"
            title="Search or jump (Ctrl/Cmd+K)"
          >
            <Search className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all duration-300" />
            <span className="text-sm group-hover:text-foreground transition-colors duration-300">Search or jump...</span>
            <span className="ml-2 text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 group-hover:border-primary group-hover:text-primary transition-all duration-300">Ctrl</span>
            <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5 group-hover:border-primary group-hover:text-primary transition-all duration-300">K</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Credits pill */}
          {location.pathname !== "/dashboard" && (
            <button
              onClick={() => navigate('/credits-usage')}
              className={`group hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 ${lowCredits
                ? 'border-red-300 bg-gradient-to-r from-red-50 to-red-100 text-red-700 hover:from-red-100 hover:to-red-200 hover:border-red-400'
                : 'border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 hover:from-purple-100 hover:to-indigo-100 hover:border-purple-400'
                }`}
              title="View credits usage"
            >
              <span className="font-semibold transition-all duration-300 group-hover:scale-110">
                {creditsLoading ? '—' : (credits != null ? credits : '—')}
              </span>
              <span className="text-xs opacity-80">credits</span>
              {lowCredits && (
                <span className="ml-1 h-2 w-2 rounded-full bg-red-500 animate-pulse group-hover:scale-125 transition-transform duration-300" />
              )}
            </button>
          )}

          {/* Theme toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            className="group relative p-2 rounded-full hover:bg-muted transition-all duration-300 hover:scale-110 active:scale-95"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={isDark ? 'Light mode' : 'Dark mode'}
          >
            {isDark ? (
              <Sun className="h-5 w-5 text-foreground group-hover:text-primary transition-all duration-300" />
            ) : (
              <Moon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300" />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="group relative p-2 rounded-full hover:bg-muted transition-all duration-300 hover:scale-110 active:scale-95"
              onClick={(e) => { e.stopPropagation(); setShowNotif((s) => !s); setShowUserMenu(false); }}
              aria-haspopup="true"
              aria-expanded={showNotif}
            >
              <Bell className={`h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-300 ${showNotif ? 'animate-bell-ring' : 'group-hover:scale-110 group-hover:rotate-12'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-red-200 group-hover:ring-red-300 group-hover:scale-125 transition-all duration-300"></span>
              )}
            </button>
            {showNotif && (
              <div
                className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden max-h-[500px] flex flex-col animate-notification-slide"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <p className="text-sm font-medium text-card-foreground">Notifications</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-primary font-medium hover:underline transition-all duration-200 hover:scale-105"
                      >
                        Mark all as read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          navigate('/notifications');
                          setShowNotif(false);
                        }}
                        className="text-xs text-primary font-medium hover:underline transition-all duration-200 hover:scale-105"
                      >
                        View all
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {notificationsLoading ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">No notifications</div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification._id}
                          className={`group/notif px-4 py-3 cursor-pointer transition-all duration-200 
  hover:bg-accent/80
  ${!notification.isRead ? 'bg-muted/80 border-l-4 border-primary' : 'hover:bg-muted/50'}
  `}
                          onClick={() => {
                            navigate('/notifications');
                            setShowNotif(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-card-foreground">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2.5 w-2.5 bg-primary rounded-full mt-1 flex-shrink-0 animate-pulse group-hover/notif:scale-125 transition-transform duration-300"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User menu trigger */}
          <div className="relative" ref={userRef}>
            <button
              className="group flex items-center space-x-3 transition-all duration-300 hover:scale-110 active:scale-95"
              onClick={(e) => { e.stopPropagation(); setShowUserMenu((s) => !s); setShowNotif(false); }}
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div className="relative">
                <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-xs text-primary-foreground font-semibold shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:ring-2 group-hover:ring-ring/40">
                  {organizationDetail && accountType === 'organization' ? (
                    organizationDetail.logo ? (
                      <img
                        src={organizationDetail.logo}
                        alt={organizationDetail.name}
                        className="h-8 w-8 rounded-full object-contain "
                      />
                    ) : (
                      <span >
                        {getInitials(organizationDetail.name)}
                      </span>
                    )
                  ) : (
                    <span >
                      {getInitials((user as any)?.fullname)}
                    </span>
                  )}
                </div>
                {isPaidPlan && (
                  <div className="absolute top-0 right-1 transform translate-x-1/2 -translate-y-1/2 rotate-35 z-10 group-hover:rotate-12 group-hover:scale-110 transition-all duration-300">
                    <Crown className="h-4 w-4 text-yellow-500 drop-shadow-sm animate-crown-glow" />
                  </div>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right sidebar user menu */}
      {showUserMenu && (
        <div className="fixed inset-0 z-[95]" onClick={() => setShowUserMenu(false)}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl ring-1 ring-border animate-user-menu-slide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="border-b border-border bg-gradient-to-r from-primary to-primary/85 px-5 py-4 text-primary-foreground">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold tracking-wide">Account <span className='text-xs'>#{(user as any)?.id || "—"}</span></h3>
                  <button
                    className="rounded-lg p-1.5 opacity-90 hover:bg-primary-foreground/15"
                    onClick={() => { setShowUserMenu(false); setShowSwitcher(false); }}
                    aria-label="Close account panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-foreground/20 text-sm font-semibold">
                    {organizationDetail && accountType === 'organization'
                      ? getInitials(organizationDetail.name)
                      : getInitials((user as any)?.fullname)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                        {organizationDetail && accountType === 'organization'
                          ? formatName(organizationDetail.name)
                          : formatName((user as any)?.fullname)}
                    </p>
                    <p className="truncate text-xs opacity-90">{(user as any)?.email || "—"}</p>
                  </div>
                  <button
                    onClick={() => setShowSwitcher((prev) => !prev)}
                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-primary-foreground/35 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                    aria-label="Switch account"
                    title="Switch account"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4">
                <div className="space-y-2">
                  {[
                    { label: 'Manage Account', icon: User, action: () => navigate('/account/profile') },
                    { label: 'Organizations', icon: Building2, action: () => navigate('/organizations/') },
                    { label: 'Email Configuration', icon: Mail, action: () => navigate('/account/email-configuration/') },
                    { label: 'Email Templates', icon: FileText, action: () => navigate('/account/email-templates/') },
                    { label: 'Rewards', icon: Gift, action: () => navigate('/account/rewards') },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => { item.action(); setShowUserMenu(false); }}
                      className="group flex w-full items-center justify-between border-b border-border bg-card px-3 py-2.5 text-left text-sm font-medium text-card-foreground hover:border-primary/35 hover:bg-muted/60"
                    >
                      <span className="inline-flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-primary" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border p-4">
                <button
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/20"
                  onClick={() => { setShowUserMenu(false); setShowSwitcher(false); handleLogout(); }}
                >
                  <LogOut className="h-4 w-4 transition-transform group-hover:rotate-12" />
                  Log Out
                </button>
              </div>
            </div>
          </aside>
          {showSwitcher && (
            <div
              className="fixed right-4 top-24 z-[130] w-72 rounded-sm border border-border bg-muted p-2 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Switch account</div>
              <button
                className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-xs flex items-center gap-2 ${
                  accountType === 'user' ? 'bg-accent text-accent-foreground ring-1 ring-border' : 'hover:bg-background'
                }`}
                onClick={() => handleAccountSwitch('user')}
              >
                <User className="h-4 w-4" /> {formatName((user as any)?.fullname)}
              </button>
              {allOrganizations.length > 0 && allOrganizations.map((org) => (
                <button
                  key={org._id}
                  className={`mt-1 w-full rounded-lg px-3 py-2 text-left text-xs flex items-center gap-2 ${
                    accountType === 'organization' && organizationId === org._id
                      ? 'bg-accent text-accent-foreground ring-1 ring-border'
                      : 'hover:bg-background'
                  }`}
                  onClick={() => handleAccountSwitch('organization', org)}
                >
                  <Building2 className="h-4 w-4" /> {org.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Command Palette */}
      {showPalette && (
        <div className="fixed inset-0 z-[100] animate-palette-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
          <div className="relative mx-auto mt-24 max-w-xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden animate-palette-slide">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/40">
              <Search className="h-4 w-4 text-primary animate-pulse" />
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Search actions and pages..."
                className="flex-1 outline-none text-sm text-card-foreground bg-transparent placeholder:text-muted-foreground focus:placeholder:text-muted-foreground/70 transition-colors"
              />
              <button className="text-xs text-muted-foreground hover:text-primary hover:scale-110 transition-all duration-200 font-medium" onClick={() => setShowPalette(false)}>Esc</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {paletteItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-muted-foreground">No results</div>
              ) : (
                <ul className="py-1">
                  {paletteItems.map((item, index) => (
                    <li key={item.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-palette-item-fade">
                      <button
                        onClick={() => { setShowPalette(false); item.action(); }}
                        className="group w-full text-left px-4 py-2.5 hover:bg-muted/80 text-sm text-card-foreground transition-all duration-300 hover:text-primary hover:scale-[1.02] active:scale-100"
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;