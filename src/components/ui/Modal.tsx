import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Classes for the panel (size, layout, padding). */
  className: string;
  zIndex?: string;
  /** Only rendered while open, so local state inside resets on every open. */
  children: ReactNode;
}

export function Modal({ isOpen, onClose, className, zIndex = 'z-[60]', children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4`}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative ${className}`}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface ModalBannerProps {
  icon: ReactNode;
  title: string;
  /** Background color class, e.g. 'bg-emerald-600'. */
  color: string;
  onClose: () => void;
}

/** Colored header bar used by the wide grid modals. */
export function ModalBanner({ icon, title, color, onClose }: ModalBannerProps) {
  return (
    <div className={`p-6 border-b border-gray-100 flex items-center justify-between ${color} text-white`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight">{title}</h2>
        </div>
      </div>
      <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
        <X size={24} />
      </button>
    </div>
  );
}

export const WIDE_MODAL_CLASS = 'bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col';
