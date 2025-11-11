import React from 'react';
import { useAuth } from '../AuthService/AuthContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { Bell, LogOut, Menu, Search, User, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SubscriptionStorage } from '../../services/subscriptionService';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { userPlan, isFreePlan } = useSubscription();
  const navigate = useNavigate();
  
  // Check if user has a paid plan
  const isPaidPlan = userPlan && !isFreePlan();

  const [showNotif, setShowNotif] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showPalette, setShowPalette] = React.useState(false);
  const [paletteQuery, setPaletteQuery] = React.useState('');
  const [credits, setCredits] = React.useState<number>(() => SubscriptionStorage.getPlan()?.creditsBalance ?? 0);
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

  // Load credits from storage and listen for changes
  React.useEffect(() => {
    try { setCredits(SubscriptionStorage.getPlan()?.creditsBalance ?? 0); } catch {}
    const onStorage = () => {
      try { setCredits(SubscriptionStorage.getPlan()?.creditsBalance ?? 0); } catch {}
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

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
    try {
      await logout();
    } finally {
      navigate('/login');
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

  const lowCredits = Number.isFinite(credits) && credits <= 10;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </button>

          {/* Command palette trigger */}
          <button
            onClick={() => setShowPalette(true)}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600"
            title="Search or jump (Ctrl/Cmd+K)"
          >
            <Search className="h-4 w-4 text-gray-500" />
            <span className="text-sm">Search or jump...</span>
            <span className="ml-2 text-[10px] text-gray-400 border border-gray-200 rounded px-1">Ctrl</span>
            <span className="text-[10px] text-gray-400 border border-gray-200 rounded px-1">K</span>
          </button>
        </div>

        <div className="flex items-center space-x-4">
          {/* Credits pill */}
          <button
            onClick={() => navigate('/credits-usage')}
            className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border ${lowCredits ? 'border-red-200 bg-red-50 text-red-700' : 'border-purple-200 bg-purple-50 text-purple-700'}`}
            title="View credits usage"
          >
            <span className="font-medium">{Number.isFinite(credits) ? credits : '—'}</span>
            <span className="text-xs opacity-80">credits</span>
            {lowCredits && <span className="ml-1 h-2 w-2 rounded-full bg-red-500" />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
              onClick={(e) => { e.stopPropagation(); setShowNotif((s) => !s); setShowUserMenu(false); }}
              aria-haspopup="true"
              aria-expanded={showNotif}
            >
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-0 right-0 h-2 w-2 bg-error-500 rounded-full"></span>
            </button>
            {showNotif && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Notifications</p>
                </div>
                <div className="p-4 text-sm text-gray-600">No notifications</div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              className="flex items-center space-x-3"
              onClick={(e) => { e.stopPropagation(); setShowUserMenu((s) => !s); setShowNotif(false); }}
              aria-haspopup="true"
              aria-expanded={showUserMenu}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{formatName((user as any)?.fullname)}</p>
              
              </div>
              <div className="relative">
                <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                {isPaidPlan && (
                  <div className="absolute top-0 right-1 transform translate-x-1/2 -translate-y-1/2 rotate-35 z-10">
                    <Crown className="h-4 w-4 text-yellow-500  drop-shadow-sm" />
                  </div>
                )}
              </div>
            </button>
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header section */}
                <div className="p-4">
                  <p className="text-base font-semibold text-gray-900">{formatName((user as any)?.fullname)}</p>
                  <p className="text-sm text-gray-600 mt-1">{(user as any)?.email || '—'}</p>
                  <p className="text-sm text-gray-600 mt-1">Account #{accountId}</p>
                  <p className="text-sm text-gray-600 mt-1">{formatName((user as any)?.fullname)}</p>
                  <button
                    onClick={() => { setShowUserMenu(false); navigate('/account/profile'); }}
                    className="mt-3 inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 w-full"
                  >
                    Manage Profile
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
                  className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Command Palette */}
      {showPalette && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPalette(false)} />
          <div className="relative mx-auto mt-24 max-w-xl bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                autoFocus
                value={paletteQuery}
                onChange={(e) => setPaletteQuery(e.target.value)}
                placeholder="Search actions and pages..."
                className="flex-1 outline-none text-sm text-gray-800 placeholder:text-gray-400"
              />
              <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setShowPalette(false)}>Esc</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {paletteItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-500">No results</div>
              ) : (
                <ul className="py-1">
                  {paletteItems.map(item => (
                    <li key={item.id}>
                      <button
                        onClick={() => { setShowPalette(false); item.action(); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-800"
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