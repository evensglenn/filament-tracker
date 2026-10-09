import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RefreshCw, X } from 'lucide-react';
import { useUpdateCheck } from '../hooks/useUpdateCheck';

/**
 * "Nieuwe versie" with a button to reload, at the top like the error messages. It never
 * reloads by itself, so nothing typed in a form gets lost; closing it hides it for that version.
 */
export function UpdateNotice() {
  const newVersion = useUpdateCheck();
  const [dismissed, setDismissed] = useState<string>();
  const show = newVersion !== undefined && newVersion !== dismissed;

  return (
    <div className="fixed inset-x-0 top-0 z-[70] flex justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pointer-events-none">
      <AnimatePresence>
        {show && (
          <motion.div
            role="status"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="pointer-events-auto w-full max-w-md flex items-center gap-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-2xl shadow-xl pl-4 pr-2 py-2"
          >
            <RefreshCw size={20} className="text-petrol-300 dark:text-petrol-600 shrink-0" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold">Nieuwe versie</p>
              <p className="text-gray-300 dark:text-gray-600">v{newVersion} staat klaar</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="h-10 px-4 text-sm font-semibold text-white bg-petrol-600 hover:bg-petrol-700 rounded-xl transition-colors shrink-0"
            >
              Vernieuw
            </button>
            <button
              onClick={() => setDismissed(newVersion)}
              aria-label="Sluit melding"
              title="Later"
              className="w-10 h-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-white dark:hover:text-gray-900 rounded-lg shrink-0"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
