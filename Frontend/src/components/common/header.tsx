import React, { useState } from 'react';
import { useAuth } from '../AuthService/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { Bell, LogOut, Menu, Search, Crown } from 'lucide-react';
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

  // Fetch notifications on mount and when user changes
  React.useEffect(() => {
    if (user) {
      fetchOrganizations();
      fetchNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);
  const fetchOrganizations = async () => {
    try {
      const response = await organizationApi.get('/api/organization/user-organizations');
      const data = response.data?.data ?? response.data;
      setAllOrganizations(Array.isArray(data) ? data : data ? [data] : []);
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  };
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

  const accountId = (user as any)?.accountId || (user as any)?.id || (user as any)?._id || 'N/A';
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
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="group p-2 rounded-lg hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-300 lg:hidden hover:scale-110 active:scale-95"
          >
            <Menu className="h-5 w-5 text-gray-500 group-hover:text-[#3E2B66] group-hover:rotate-90 transition-all duration-300" />
          </button>

          {/* Command palette trigger */}
          <button
            onClick={() => setShowPalette(true)}
            className="group hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:border-[#3E2B66] hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent text-gray-600 transition-all duration-300 hover:shadow-md hover:scale-[1.02] active:scale-100"
            title="Search or jump (Ctrl/Cmd+K)"
          >
            <Search className="h-4 w-4 text-gray-500 group-hover:text-[#3E2B66] group-hover:scale-110 transition-all duration-300" />
            <span className="text-sm group-hover:text-[#3E2B66] transition-colors duration-300">Search or jump...</span>
            <span className="ml-2 text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 group-hover:border-[#3E2B66] group-hover:text-[#3E2B66] transition-all duration-300">Ctrl</span>
            <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 group-hover:border-[#3E2B66] group-hover:text-[#3E2B66] transition-all duration-300">K</span>
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

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="group relative p-2 rounded-full hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent transition-all duration-300 hover:scale-110 active:scale-95"
              onClick={(e) => { e.stopPropagation(); setShowNotif((s) => !s); setShowUserMenu(false); }}
              aria-haspopup="true"
              aria-expanded={showNotif}
            >
              <Bell className={`h-5 w-5 text-gray-500 group-hover:text-[#3E2B66] transition-all duration-300 ${showNotif ? 'animate-bell-ring' : 'group-hover:scale-110 group-hover:rotate-12'}`} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-red-500 rounded-full animate-pulse ring-2 ring-red-200 group-hover:ring-red-300 group-hover:scale-125 transition-all duration-300"></span>
              )}
            </button>
            {showNotif && (
              <div
                className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden max-h-[500px] flex flex-col animate-notification-slide"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Notifications</p>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-xs text-[#3E2B66] hover:text-[#260559] font-medium hover:underline transition-all duration-200 hover:scale-105"
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
                        className="text-xs text-[#3E2B66] hover:text-[#260559] font-medium hover:underline transition-all duration-200 hover:scale-105"
                      >
                        View all
                      </button>
                    )}
                  </div>
                </div>
                <div className="overflow-y-auto flex-1">
                  {notificationsLoading ? (
                    <div className="p-4 text-sm text-gray-600 text-center">Loading...</div>
                  ) : notifications.length === 0 ? (
                    <div className="p-4 text-sm text-gray-600 text-center">No notifications</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {notifications.slice(0, 3).map((notification) => (
                        <div
                          key={notification._id}
                          className={`group/notif px-4 py-3 cursor-pointer transition-all duration-200 
  hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100
  ${!notification.isRead ? 'bg-blue-50 border-l-4 border-[#3E2B66]' : 'hover:bg-gray-50'}
  `}
                          onClick={() => {
                            navigate('/notifications');
                            setShowNotif(false);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2.5 w-2.5 bg-[#3E2B66] rounded-full mt-1 flex-shrink-0 animate-pulse group-hover/notif:scale-125 transition-transform duration-300"></div>
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

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              className="group flex items-center space-x-3 transition-all duration-300 hover:scale-110 active:scale-95"
              onClick={(e) => { e.stopPropagation(); setShowUserMenu((s) => !s); setShowNotif(false); }}
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div className="relative">
                <div className="h-8 w-8 bg-gradient-to-br from-[#3E2B66] to-[#260559] rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:ring-2 group-hover:ring-purple-200">
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
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50  animate-user-menu-slide"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header section */}
                <div className="p-4">
                  {/* Name row */}
                  <div className="flex items-center gap-2 relative">
                    {/* User name */}
                    <p className="text-base font-semibold text-gray-900">
                      {organizationDetail && accountType === 'organization'
                        ? formatName(organizationDetail.name)
                        : formatName((user as any)?.fullname)}
                    </p>
                    <div className="relative group">
                      <button
                        onClick={() => setShowSwitcher(prev => !prev)}
                        className="flex items-center justify-center w-8 h-8 rounded-full
                                  border border-gray-300 text-gray-600
                                  hover:border-[#3E2B66] hover:text-[#3E2B66]
                                  transition"
                        aria-label="Switch account"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7h12m0 0-4-4m4 4-4 4M16 17H4m0 0 4 4m-4-4 4-4"
                          />
                        </svg>
                      </button>

                      {/* Tooltip */}
                      <div
                        className="absolute left-1/2 -translate-x-1/2 top-full mt-2
                                  whitespace-nowrap rounded-md bg-gray-900 px-2 py-1
                                  text-xs text-white opacity-0 group-hover:opacity-100
                                  transition pointer-events-none z-50"
                      >
                        Switch account
                      </div>
                    </div>
                    {/* Dropdown */}
                    {showSwitcher && (
                      <div className="absolute left-0 top-full mt-2 w-52 rounded-lg
                                      border border-gray-200 bg-white shadow-lg z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-900 tracking-wide">
                            Switch Account
                          </p>
                        </div>
                        <button
                          className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                          onClick={async () => { await switchAccount('user'); setShowUserMenu(false); setShowSwitcher(false); }}
                        >
                          <div className={`flex items-center gap-2 
                                ${accountType === 'user'
                              ? "bg-green-50 px-1 py-2 border border-green-300 rounded-md"
                              : "hover:bg-gray-100"
                            }`}>
                            <div className="h-8 w-8 bg-gradient-to-br from-[#3E2B66] to-[#260559] rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:ring-2 group-hover:ring-purple-200">
                              {getInitials((user as any)?.fullname)}
                            </div>

                            <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                              {formatName((user as any)?.fullname)}
                            </p>
                          </div>
                        </button>
                        {allOrganizations.length > 0 && allOrganizations.map((org) => (
                          <button
                            key={org._id}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                            onClick={async () => { await switchAccount('organization', org._id); setShowUserMenu(false); setShowSwitcher(false); }}
                          >
                            <div className={`flex items-center gap-2 
                              ${accountType === 'organization' && organizationId === org._id
                                ? "bg-green-50 px-1 py-2 border border-green-300 rounded-md"
                                : "hover:bg-gray-100"
                              }`}>
                              <div className="h-8 w-8 bg-gradient-to-br from-[#3E2B66] to-[#260559] rounded-full flex items-center justify-center text-xs text-white font-semibold shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:ring-2 group-hover:ring-purple-200">
                                {org.name
                                  .split(' ')
                                  .map((word) => word[0].toUpperCase())
                                  .join('')
                                  .slice(0, 2)}
                              </div>
                              <p className="text-xs font-semibold text-gray-900 whitespace-nowrap">
                                {org.name}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {organizationDetail && accountType === 'organization' ?
                    <div>
                      <a href={
                        organizationDetail?.website?.startsWith('http')
                          ? organizationDetail?.website
                          : `https://${organizationDetail?.website}`
                      }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline text-purple-600"
                      >
                        {organizationDetail.website}
                      </a>
                      <p className="text-sm text-gray-600 mt-1">Account #{organizationDetail?._id || "_"}</p>
                    </div>
                    : (
                      <div>
                        <p className="text-sm text-gray-600 mt-1">{(user as any)?.email || "—"}</p>
                        <p className="text-sm text-gray-600 mt-1">Account #{accountId}</p>
                      </div>
                    )}

                  {/* ✅ Manage Profile button (restored) */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/account/profile");
                    }}
                    className="mt-3 inline-flex items-center justify-center px-4 py-2
                              border border-gray-300 rounded-lg text-sm font-medium text-gray-900
                              hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent
                              hover:border-[#3E2B66] hover:text-[#3E2B66]
                              transition-all duration-300 w-full hover:scale-[1.02]"
                  >
                    Manage Profile
                  </button>
                  {/* Organization Button */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/organizations/");
                    }}
                    className="mt-3 inline-flex items-center justify-center px-4 py-2
                              border border-gray-300 rounded-lg text-sm font-medium text-gray-900
                              hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent
                              hover:border-[#3E2B66] hover:text-[#3E2B66]
                              transition-all duration-300 w-full hover:scale-[1.02]"
                  >
                    Organizations
                  </button>
                  {/* Email Configuration Button */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/account/email-configuration/");
                    }}
                    className="mt-3 inline-flex items-center justify-center px-4 py-2
                              border border-gray-300 rounded-lg text-sm font-medium text-gray-900
                              hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent
                              hover:border-[#3E2B66] hover:text-[#3E2B66]
                              transition-all duration-300 w-full hover:scale-[1.02]"
                  >
                    Email-Configuration
                  </button>
                  {/* Email Templates */}
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      navigate("/account/email-templates/");
                    }}
                    className="mt-3 inline-flex items-center justify-center px-4 py-2
                              border border-gray-300 rounded-lg text-sm font-medium text-gray-900
                              hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent
                              hover:border-[#3E2B66] hover:text-[#3E2B66]
                              transition-all duration-300 w-full hover:scale-[1.02]"
                  >
                    Email-Templates
                  </button>
                </div>
                <div className="border-t border-gray-100" />
                {/* Options */}
                {/* <button
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50"
                  onClick={() => { setShowUserMenu(false); navigate('/account/preferences'); }}
                >
                  My Preferences
                </button> */}
                <button
                  className="group/logout w-full text-left px-4 py-3 text-sm hover:bg-gradient-to-r hover:from-red-50 hover:to-transparent flex items-center gap-2 text-red-600 transition-all duration-300 hover:scale-[1.02] active:scale-100"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 group-hover/logout:rotate-12 group-hover/logout:scale-110 transition-all duration-300" /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showPalette && (
        <div className="fixed inset-0 z-[100] animate-palette-fade-in">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowPalette(false)} />
          <div className="relative mx-auto mt-24 max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-palette-slide">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-purple-50/30 to-transparent">
              <Search className="h-4 w-4 text-[#3E2B66] animate-pulse" />
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Search actions and pages..."
                className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400 focus:placeholder:text-gray-300 transition-colors"
              />
              <button className="text-xs text-gray-500 hover:text-[#3E2B66] hover:scale-110 transition-all duration-200 font-medium" onClick={() => setShowPalette(false)}>Esc</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {paletteItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">No results</div>
              ) : (
                <ul className="py-1">
                  {paletteItems.map((item, index) => (
                    <li key={item.id} style={{ animationDelay: `${index * 50}ms` }} className="animate-palette-item-fade">
                      <button
                        onClick={() => { setShowPalette(false); item.action(); }}
                        className="group w-full text-left px-4 py-2.5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-transparent text-sm text-gray-800 transition-all duration-300 hover:text-[#3E2B66] hover:scale-[1.02] active:scale-100"
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