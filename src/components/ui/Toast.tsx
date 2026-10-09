import { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { describeError } from '../../utils/errors';

const VISIBLE_MS = 7000;

interface Toast {
  id: number;
  title: string;
  detail: string;
}

/** Shows "<what> is mislukt" with the reason, e.g. showError('Print registreren', error). */
type ShowError = (what: string, error: unknown) => void;

const ToastContext = createContext<ShowError>(() => {});

export const useShowError = () => useContext(ToastContext);

/** Error messages above everything else that fade out by themselves. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => setToasts(all => all.filter(t => t.id !== id)), []);

  const showError = useCallback<ShowError>((what, error) => {
    console.error(`${what} failed:`, error);
    const id = nextId.current++;
    setToasts(all => [...all.slice(-2), { id, title: `${what} is mislukt.`, detail: describeError(error) }]);
    window.setTimeout(() => dismiss(id), VISIBLE_MS);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={showError}>
      {children}
      {/* At the top, so they never cover the buttons of a dialog (which sit at the bottom) */}
      <div className="fixed inset-x-0 top-0 z-[80] flex flex-col items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              role="alert"
              layout
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="pointer-events-auto w-full max-w-md flex items-start gap-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl shadow-xl px-4 py-3"
            >
              <AlertCircle size={20} className="text-danger-light shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold">{toast.title}</p>
                <p className="text-gray-300 dark:text-gray-600">{toast.detail}</p>
              </div>
              <button onClick={() => dismiss(toast.id)} aria-label="Sluit melding" className="p-1 -mr-1 text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 rounded-lg">
                <X size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
