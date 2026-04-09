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
  Scale, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  Settings,
  ChevronDown,
  LayoutDashboard 
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
  { path: '/support-tools', label: 'Support Tools' },
  { path: '/forms', label: 'Forms' },
  { path: '/concierge', label: 'Concierge' },
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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 dark:bg-slate-950 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-700 rounded-lg flex items-center justify-center">
                <Scale className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-800 dark:text-white">
                DivorceOS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => {
                  if (link.path === '/' && location.pathname === '/') {
                    scrollToPageTop();
                  }
                }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path))
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="outline"
              className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-200 dark:border-emerald-500 dark:hover:bg-emerald-950/40"
              onClick={handleChatCta}
            >
              Talk to Maria
            </Button>
            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 text-gray-700 dark:text-slate-200">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center">
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
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/pricing" className="cursor-pointer">
                      <Scale className="h-4 w-4 mr-2" />
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
                  className="bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Sign In/Create Account
                </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:bg-gray-100 dark:text-slate-200 dark:hover:bg-slate-900/70"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 dark:bg-slate-950 dark:border-slate-800">
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
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  (link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path))
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}

            <ThemeToggle showLabel className="mt-2" />

            <Button
              variant="outline"
              className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-200 dark:border-emerald-500 dark:hover:bg-emerald-950/40"
              onClick={() => {
                handleChatCta();
                setIsMobileMenuOpen(false);
              }}
            >
              Talk to Maria
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
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
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
