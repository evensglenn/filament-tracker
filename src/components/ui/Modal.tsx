import { ReactNode, RefObject, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Width and layout of the panel, e.g. 'sm:max-w-lg'. */
  className?: string;
  zIndex?: string;
  /** Only rendered while open, so local state inside resets on every open. */
  children: ReactNode;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

/**
 * Dialog behavior while open: Escape closes, Tab stays inside, the page behind doesn't scroll,
 * and focus returns to where it was (e.g. the button that opened it) after closing.
 */
function useDialogBehavior(panel: RefObject<HTMLDivElement | null>, isOpen: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    // Focus the panel itself rather than its first input, so phones don't pop up the keyboard
    panel.current?.focus({ preventScroll: true });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !panel.current) return;
      const focusable = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(el => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, [isOpen, panel]);
}

/** A centered dialog on larger screens and a bottom sheet on phones. */
export function Modal({ isOpen, onClose, className = '', zIndex = 'z-[60]', children }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null);
  useDialogBehavior(panel, isOpen, onClose);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndex} flex items-end sm:items-center justify-center sm:p-4`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            tabIndex={-1}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`relative w-full bg-white dark:bg-gray-900 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl outline-none ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  onClose: () => void;
}

export function ModalHeader({ title, subtitle, icon, onClose }: ModalHeaderProps) {
  return (
    <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 shrink-0">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-petrol-50 dark:bg-petrol-950 text-petrol-600 dark:text-petrol-400 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
      <button onClick={onClose} aria-label="Sluit" className="p-2 -mr-2 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
        <X size={20} />
      </button>
    </div>
  );
}

/** Sticky action bar at the bottom of a modal, clear of the phone's home indicator. */
export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex gap-3 shrink-0">
      {children}
    </div>
  );
}

export const SECONDARY_BUTTON = 'flex-1 px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-[0.98]';
/** Add to a primary button while it has something to confirm; off for people who prefer less motion. */
export const ATTENTION = 'motion-safe:animate-attention';

export const PRIMARY_BUTTON = 'flex-[2] px-5 py-3 bg-petrol-600 text-white font-bold rounded-xl hover:bg-petrol-700 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';
