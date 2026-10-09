import { ReactNode } from 'react';
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

/** A centered dialog on larger screens and a bottom sheet on phones. */
export function Modal({ isOpen, onClose, className = '', zIndex = 'z-[60]', children }: ModalProps) {
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
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className={`relative w-full bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] rounded-t-3xl sm:rounded-3xl ${className}`}
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
    <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-bold leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>
      <button onClick={onClose} aria-label="Sluiten" className="p-2 -mr-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">
        <X size={20} />
      </button>
    </div>
  );
}

/** Sticky action bar at the bottom of a modal, clear of the phone's home indicator. */
export function ModalFooter({ children }: { children: ReactNode }) {
  return (
    <div className="px-5 sm:px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-white border-t border-gray-100 flex gap-3 shrink-0">
      {children}
    </div>
  );
}

export const SECONDARY_BUTTON = 'flex-1 px-5 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-[0.98]';
export const PRIMARY_BUTTON = 'flex-[2] px-5 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';
