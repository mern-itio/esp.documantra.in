import React from 'react';
import { useAuth } from '../AuthService/AuthContext';
import { Bell, LogOut, Menu, Search, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showNotif, setShowNotif] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);
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

  return (
    <header className="bg-gray-100 shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 lg:hidden"
          >
            <Menu className="h-5 w-5 text-gray-500" />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search compliance data..."
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div className="flex items-center space-x-4">
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
                className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                onClick={(e) => e.stopPropagation()}
              >
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
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
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
    </header>
  );
};

export default Header;