import { Moon, Sun } from 'lucide-react';
import { useColorMode } from '../context/ColorMode';

/** Sliding switch: sun on the left (light), moon on the right (dark). */
export function ColorModeToggle() {
  const { mode, toggle } = useColorMode();
  const dark = mode === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      onClick={toggle}
      className="relative inline-flex h-8 w-16 shrink-0 items-center rounded-full border border-input bg-muted transition-colors hover:bg-accent"
    >
      <Sun className="absolute left-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <Moon className="absolute right-2 h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <span
        className={`absolute left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform duration-200 ${dark ? 'translate-x-8' : 'translate-x-0'}`}
      >
        {dark ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
