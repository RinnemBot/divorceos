import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sparkles,
  Scale,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
  LayoutDashboard,
  ReceiptText,
  BarChart3,
} from 'lucide-react';
import { authService, type User, SUBSCRIPTION_LIMITS } from '@/services/auth';
import { ThemeToggle } from '@/components/ThemeToggle';

interface NavigationProps {
  currentUser: User | null;
  onAuthClick: () => void;
  onLogout: () => void;
}

const navLinks = [
  { path: '/', label: 'Home' },
  { path: '/support-tools', label: 'Tools' },
  { path: '/chats', label: 'Chats' },
  { path: '/forms', label: 'Forms' },
  { path: '/draft-forms', label: 'Drafts' },
  { path: '/concierge', label: 'Concierge' },
  { path: '/pricing', label: 'Pricing' },
];

const scrollToPageTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }
};

function UserAvatar({ user, className = 'w-8 h-8' }: { user: User; className?: string }) {
  const avatarUrl = user.profile?.avatarUrl;

  if (avatarUrl) {
    return (
      <div className={`${className} overflow-hidden rounded-full bg-emerald-100 ring-1 ring-emerald-100`}>
        <img src={avatarUrl} alt="User avatar" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className={`${className} rounded-full bg-emerald-500 flex items-center justify-center`}>
      <UserIcon className="h-4 w-4 text-white" />
    </div>
  );
}

export function Navigation({ currentUser, onAuthClick, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  const handleChatCta = () => {
    if (location.pathname === '/') {
      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    navigate('/', { state: { focusChat: true, fromAppNavigation: true } });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/92 backdrop-blur-xl transition-colors dark:border-white/10 dark:bg-slate-950/90">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between gap-5">
          <div className="flex min-w-0 items-center">
            <Link
              to="/"
              onClick={() => {
                if (location.pathname === '/') {
                  scrollToPageTop();
                }
              }}
              className="flex min-w-0 items-center gap-2.5"
            >
              <div className="flex h-8 w-8 flex-none items-center justify-center rounded-xl bg-slate-950 dark:bg-white">
                <Scale className="h-4 w-4 text-white dark:text-slate-950" />
              </div>
              <span className="block truncate text-base font-semibold tracking-tight text-slate-950 dark:text-white">
                Divorce Agent
              </span>
            </Link>
          </div>

          <div className="hidden flex-1 items-center justify-center gap-3 md:flex lg:gap-5">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (link.path === '/' && location.pathname === '/') {
                    scrollToPageTop();
                  }
                }}
                className={`relative whitespace-nowrap py-1 text-sm font-medium transition-colors ${
                  (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path))
                    ? 'text-slate-950 after:absolute after:-bottom-1.5 after:left-0 after:h-0.5 after:w-full after:rounded-full after:bg-emerald-600 dark:text-white dark:after:bg-emerald-300'
                    : 'text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />
            <Button
              variant="outline"
              className="hidden h-9 rounded-full border-slate-300 bg-white/80 px-4 text-slate-900 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 lg:inline-flex"
              onClick={handleChatCta}
            >
              Ask Maria
            </Button>
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex h-9 items-center gap-2 rounded-full px-2 text-gray-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10">
                    <UserAvatar user={currentUser} />
                    <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
                      {currentUser.name || currentUser.email.split('@')[0]}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900">{currentUser.email}</p>
                    <p className="text-xs text-gray-500">
                      {SUBSCRIPTION_LIMITS[currentUser.subscription].name} Plan
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {authService.isConciergeStaff(currentUser) && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/analytics" className="cursor-pointer">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Analytics
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/bookkeeping" className="cursor-pointer">
                          <ReceiptText className="h-4 w-4 mr-2" />
                          Bookkeeping
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="cursor-pointer">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Upgrade Plan
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={onAuthClick}
                className="h-9 rounded-full bg-emerald-700 px-4 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600"
              >
                Sign In/Create Account
              </Button>
            )}
          </div>

          <div className="flex items-center md:hidden">
            <button
              type="button"
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-900/70"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-white/95 border-t border-slate-200 dark:bg-slate-950 dark:border-slate-800 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (link.path === '/' && location.pathname === '/') {
                    scrollToPageTop();
                  }
                  setIsMobileMenuOpen(false);
                }}
                className={`block px-3 py-2 rounded-xl text-base font-medium ${
                  (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path))
                    ? 'bg-slate-950 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <ThemeToggle showLabel className="mt-2" />

            <Button
              variant="outline"
              className="w-full border-slate-300 bg-white/80 text-slate-900 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
              onClick={() => {
                handleChatCta();
                setIsMobileMenuOpen(false);
              }}
            >
              Ask Maria
            </Button>

            <div className="border-t border-gray-200 pt-3 mt-3 dark:border-slate-800">
              {currentUser ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <UserAvatar user={currentUser} className="h-10 w-10" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.email}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {SUBSCRIPTION_LIMITS[currentUser.subscription].name} Plan
                    </p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-900/70"
                  >
                    Dashboard
                  </Link>
                  {authService.isConciergeStaff(currentUser) && (
                    <Link
                      to="/bookkeeping"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-900/70"
                    >
                      Bookkeeping
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-900/70"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Button
                  onClick={() => {
                    onAuthClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600"
                >
                  Sign In/Create Account
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
