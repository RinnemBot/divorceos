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
  BarChart3,
  ReceiptText,
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
  { path: '/what-do-i-need', label: 'Wizard' },
  { path: '/support-tools', label: 'Support' },
  { path: '/forms', label: 'Forms' },
  { path: '/draft-forms', label: 'Drafts' },
  { path: '/concierge', label: 'Concierge' },
  { path: '/efile-assistant', label: 'E-File' },
  { path: '/pricing', label: 'Pricing' },
];

const scrollToPageTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }
};

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
    navigate('/', { state: { focusChat: true } });
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-emerald-100/70 bg-white/88 backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/88 transition-colors">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6 lg:px-8">
        <div className="flex h-[4.5rem] min-h-[4.5rem] items-center justify-between gap-5 py-2">
          <div className="flex min-w-0 items-center">
            <Link
              to="/"
              onClick={() => {
                if (location.pathname === '/') {
                  scrollToPageTop();
                }
              }}
              className="flex min-w-0 items-center gap-3"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-800 to-emerald-700 shadow-[0_12px_30px_-16px_rgba(15,23,42,0.9)] dark:from-emerald-500 dark:via-emerald-400 dark:to-slate-200">
                <Scale className="h-4 w-4 text-white dark:text-slate-950" />
              </div>
              <div className="min-w-0 leading-tight">
                <span className="block truncate text-[1.05rem] font-bold tracking-[-0.035em] text-slate-950 dark:text-white">
                  Divorce Agent
                </span>
                <span className="block truncate text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700/80 dark:text-emerald-300/80">
                  California AI guidance
                </span>
              </div>
            </Link>
          </div>

          <div className="hidden xl:flex items-center rounded-full border border-slate-200/80 bg-white/72 p-1 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.45)] dark:border-white/10 dark:bg-white/[0.06]">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (link.path === '/' && location.pathname === '/') {
                    scrollToPageTop();
                  }
                }}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-semibold tracking-[-0.015em] transition-all duration-200 ${
                  (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path))
                    ? 'bg-slate-950 text-white shadow-sm dark:bg-emerald-300 dark:text-slate-950'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden xl:flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Button
              className="rounded-full bg-slate-950 px-4 font-semibold tracking-[-0.01em] text-white shadow-[0_18px_40px_-26px_rgba(15,23,42,0.9)] hover:bg-emerald-800 dark:bg-emerald-400 dark:text-slate-950 dark:hover:bg-emerald-300"
              onClick={handleChatCta}
            >
              Ask Maria
            </Button>
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-gray-700 dark:text-slate-200">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
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
                className="bg-emerald-700 text-white hover:bg-emerald-800 dark:bg-emerald-700 dark:text-white dark:hover:bg-emerald-600"
              >
                Sign In/Create Account
              </Button>
            )}
          </div>

          <div className="xl:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-900/70"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="xl:hidden bg-white/95 border-t border-emerald-100 dark:bg-slate-950 dark:border-slate-800 backdrop-blur-xl">
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
                    ? 'border border-emerald-300 bg-emerald-200 text-emerald-950 dark:border-emerald-400/40 dark:bg-emerald-300 dark:text-slate-950'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white'
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
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{currentUser.email}</p>
                    <p className="text-xs text-gray-500 dark:text-slate-400">
                      {SUBSCRIPTION_LIMITS[currentUser.subscription].name} Plan
                    </p>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-900/70"
                  >
                    Dashboard
                  </Link>
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
