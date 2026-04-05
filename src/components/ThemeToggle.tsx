import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ showLabel = false, className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const nextThemeLabel = theme === 'dark' ? 'Light' : 'Dark';

  return (
    <Button
      type="button"
      variant={showLabel ? 'outline' : 'ghost'}
      size={showLabel ? 'default' : 'icon'}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={cn(
        'text-gray-600 hover:bg-gray-100 dark:text-slate-300 dark:hover:bg-slate-800',
        showLabel && 'w-full justify-start gap-3',
        className
      )}
    >
      <Sun className={cn('h-4 w-4', theme === 'dark' && 'hidden')} />
      <Moon className={cn('h-4 w-4', theme === 'light' && 'hidden')} />
      {showLabel && <span>Switch to {nextThemeLabel} Mode</span>}
    </Button>
  );
}
