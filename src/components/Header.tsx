import { motion } from 'motion/react';
import { MenuItem, Popover } from './ui/Popover';
import { Disc, LogIn, LogOut, Menu, PackagePlus, Printer, Settings, X } from 'lucide-react';

interface HeaderProps {
  visible: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNewPrint: () => void;
  onNewDelivery: () => void;
  onOpenSettings: () => void;
}

const ICON_BUTTON = 'w-11 h-11 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors';
const PRINT_BUTTON = `${ICON_BUTTON} !text-emerald-700 bg-emerald-50 hover:!bg-emerald-100`;

export function Header({ visible, isLoggedIn, onLogin, onLogout, onNewPrint, onNewDelivery, onOpenSettings }: HeaderProps) {
  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={visible ? "visible" : "hidden"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-40"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <Disc size={20} />
          </div>
          <h1 className="text-lg font-bold tracking-tight truncate">Filament tracker</h1>
        </div>

        {isLoggedIn ? (
          <div className="flex items-center gap-1 shrink-0">
            {/* Larger screens: every action as its own icon */}
            <div className="hidden sm:flex items-center gap-1">
              <button onClick={onNewPrint} className={PRINT_BUTTON} title="Print registreren" aria-label="Print registreren">
                <Printer size={20} />
              </button>
              <button onClick={onNewDelivery} className={ICON_BUTTON} title="Levering registreren" aria-label="Levering registreren">
                <PackagePlus size={20} />
              </button>
              <button onClick={onOpenSettings} className={ICON_BUTTON} title="Instellingen" aria-label="Instellingen">
                <Settings size={20} />
              </button>
              <button onClick={onLogout} className={`${ICON_BUTTON} hover:!text-danger hover:!bg-danger-soft`} title="Uitloggen" aria-label="Uitloggen">
                <LogOut size={20} />
              </button>
            </div>

            {/* Phones: all actions behind a menu, so the title keeps its room */}
            <MobileMenu onNewPrint={onNewPrint} onNewDelivery={onNewDelivery} onOpenSettings={onOpenSettings} onLogout={onLogout} />
          </div>
        ) : (
          <button
            onClick={onLogin}
            className="h-11 px-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center gap-2 transition-colors shrink-0"
          >
            <LogIn size={18} className="text-emerald-600" />
            <span>Inloggen</span>
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
          aria-label={isOpen ? 'Menu sluiten' : 'Menu'}
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
            <MenuItem icon={<Printer size={18} />} onClick={choose(onNewPrint)}>Print registreren</MenuItem>
            <MenuItem icon={<PackagePlus size={18} />} onClick={choose(onNewDelivery)}>Levering registreren</MenuItem>
            <MenuItem icon={<Settings size={18} />} onClick={choose(onOpenSettings)}>Instellingen</MenuItem>
            <div className="my-1 border-t border-gray-100" />
            <MenuItem icon={<LogOut size={18} />} onClick={choose(onLogout)} danger>Uitloggen</MenuItem>
          </>
        );
      }}
    </Popover>
  );
}
