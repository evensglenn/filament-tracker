import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';

interface PopoverProps {
  /** The button that opens and closes the panel. */
  trigger: (props: { isOpen: boolean; toggle: () => void }) => ReactNode;
  /** Panel content; call close() after a choice. */
  children: (close: () => void) => ReactNode;
  /** Extra classes for the wrapper, e.g. 'sm:hidden'. */
  className?: string;
  /** Width of the panel, e.g. 'w-60'. */
  panelClassName?: string;
}

/** A button with a small panel that folds out under it, aligned to the right. */
export function Popover({ trigger, children, className = '', panelClassName = 'w-60' }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const close = () => setIsOpen(false);

  // Close on Escape; a tap outside is caught by the backdrop below
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  return (
    <div className={`relative ${className}`}>
      {/* Invisible backdrop: a tap outside closes the panel without also hitting what lies below.
          Rendered in <body>, because a transformed or blurred parent would confine "fixed" to itself.
          It sits under the sticky header (z-40), so the header's own menu stays usable. */}
      {isOpen && createPortal(<div className="fixed inset-0 z-[31]" aria-hidden onClick={close} />, document.body)}

      {/* Only an open popover lifts its button above the backdrop, so the button can close it again;
          other buttons stay below, and can't show through another open menu */}
      <div className={`relative ${isOpen ? 'z-[32]' : ''}`}>{trigger({ isOpen, toggle: () => setIsOpen(open => !open) })}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={`absolute right-0 top-full mt-2 z-[32] origin-top-right bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-900/10 dark:shadow-black/50 border border-gray-200 dark:border-gray-700 p-1.5 ${panelClassName}`}
          >
            {children(close)}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MenuItemProps {
  icon?: ReactNode;
  onClick: () => void;
  danger?: boolean;
  /** Shown on the right, e.g. a check mark for the active choice. */
  trailing?: ReactNode;
  children: ReactNode;
}

export function MenuItem({ icon, onClick, danger, trailing, children }: MenuItemProps) {
  return (
    <button
      role="menuitem"
      onClick={onClick}
      className={`w-full h-12 px-3 flex items-center gap-3 rounded-xl text-left font-medium transition-colors ${danger ? 'text-danger hover:bg-danger-soft' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
    >
      {icon && <span className={danger ? 'text-danger' : 'text-gray-500 dark:text-gray-400'}>{icon}</span>}
      <span className="flex-1">{children}</span>
      {trailing}
    </button>
  );
}
