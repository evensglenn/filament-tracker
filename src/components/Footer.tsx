import { Monitor, Moon, Sun } from 'lucide-react';
import { Theme, useTheme } from '../hooks/useTheme';
import { StudioEvensLogo } from './ui/StudioEvensLogo';

const OPTIONS: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Licht', Icon: Sun },
  { value: 'auto', label: 'Automatisch (zoals het toestel)', Icon: Monitor },
  { value: 'dark', label: 'Donker', Icon: Moon },
];

/** The theme choice, the version and the Studio Evens logo, like in the "ik leer lezen" app. */
export function Footer() {
  const { theme, setTheme } = useTheme();

  return (
    <footer className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-[max(2rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-2.5">
      <div role="group" aria-label="Thema" className="inline-flex gap-0.5 p-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full">
        {OPTIONS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            aria-pressed={theme === value}
            aria-label={label}
            title={label}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-colors ${
              theme === value ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon size={16} />
          </button>
        ))}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500">v{__APP_VERSION__}</p>
      {/* Light gray at rest, in color on hover */}
      <div className="group mt-1 p-1" title="Studio Evens">
        <StudioEvensLogo className="h-5 w-auto" />
      </div>
    </footer>
  );
}
