import { motion } from 'motion/react';
import { MenuItem, Popover } from './ui/Popover';
import { AppIcon } from './ui/AppIcon';
import { LogIn, LogOut, Menu, PackagePlus, Printer, Settings, X } from 'lucide-react';

interface HeaderProps {
  visible: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNewPrint: () => void;
  onNewDelivery: () => void;
  onOpenSettings: () => void;
}

const ICON_BUTTON = 'w-11 h-11 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors';
const PRINT_BUTTON = `${ICON_BUTTON} !text-petrol-700 dark:!text-petrol-400 bg-petrol-50 dark:bg-petrol-950 hover:!bg-petrol-100 dark:hover:!bg-petrol-900`;

export function Header({ visible, isLoggedIn, onLogin, onLogout, onNewPrint, onNewDelivery, onOpenSettings }: HeaderProps) {
  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={visible ? "visible" : "hidden"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <AppIcon className="w-9 h-9" />
          <h1 className="text-lg font-bold tracking-tight truncate">Filament tracker</h1>
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-1 shrink-0">
            {/* Larger screens: every action as its own icon */}
            <div className="hidden sm:flex items-center gap-1">
              <button onClick={onNewPrint} className={PRINT_BUTTON} title="Registreer print" aria-label="Registreer print">
                <Printer size={20} />
              </button>
              <button onClick={onNewDelivery} className={ICON_BUTTON} title="Registreer levering" aria-label="Registreer levering">
                <PackagePlus size={20} />
              </button>
              <button onClick={onOpenSettings} className={ICON_BUTTON} title="Instellingen" aria-label="Instellingen">
                <Settings size={20} />
              </button>
              <button onClick={onLogout} className={`${ICON_BUTTON} hover:!text-danger hover:!bg-danger-soft`} title="Log uit" aria-label="Log uit">
                <LogOut size={20} />
              </button>
            </div>

            {/* Phones: all actions behind a menu, so the title keeps its room */}
            <MobileMenu onNewPrint={onNewPrint} onNewDelivery={onNewDelivery} onOpenSettings={onOpenSettings} onLogout={onLogout} />
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="h-11 px-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold flex items-center gap-2 transition-colors shrink-0"
          >
            <LogIn size={18} className="text-petrol-600 dark:text-petrol-400" />
            <span>Log in</span>
          </button>
        )}
      </div>
    </motion.header>
  );
}

type MobileMenuProps = Pick<HeaderProps, 'onNewPrint' | 'onNewDelivery' | 'onOpenSettings' | 'onLogout'>;

function MobileMenu({ onNewPrint, onNewDelivery, onOpenSettings, onLogout }: MobileMenuProps) {
  return (
    <Popover
      className="sm:hidden"
      trigger={({ isOpen, toggle }) => (
        <button
          onClick={toggle}
          className={ICON_BUTTON}
          aria-label={isOpen ? 'Sluit menu' : 'Menu'}
          aria-expanded={isOpen}
          aria-haspopup="menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}
    >
      {close => {
        const choose = (action: () => void) => () => { close(); action(); };
        return (
          <>
            <MenuItem icon={<Printer size={18} />} onClick={choose(onNewPrint)}>Registreer print</MenuItem>
            <MenuItem icon={<PackagePlus size={18} />} onClick={choose(onNewDelivery)}>Registreer levering</MenuItem>
            <MenuItem icon={<Settings size={18} />} onClick={choose(onOpenSettings)}>Instellingen</MenuItem>
            <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
            <MenuItem icon={<LogOut size={18} />} onClick={choose(onLogout)} danger>Log uit</MenuItem>
          </>
        );
      }}
    </Popover>
  );
}
