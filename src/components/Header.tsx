import { motion } from 'motion/react';
import { Disc, LogIn, LogOut, PackagePlus, Printer, Settings } from 'lucide-react';

interface HeaderProps {
  visible: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onNewPrint: () => void;
  onNewDelivery: () => void;
  onOpenSettings: () => void;
}

const ICON_BUTTON = 'w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors';

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

        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {isLoggedIn ? (
            <>
              <button onClick={onNewPrint} className={`${ICON_BUTTON} !text-emerald-700 bg-emerald-50 hover:!bg-emerald-100`} title="Print registreren" aria-label="Print registreren">
                <Printer size={20} />
              </button>
              <button onClick={onNewDelivery} className={ICON_BUTTON} title="Levering registreren" aria-label="Levering registreren">
                <PackagePlus size={20} />
              </button>
              <button onClick={onOpenSettings} className={ICON_BUTTON} title="Instellingen" aria-label="Instellingen">
                <Settings size={20} />
              </button>
              <button onClick={onLogout} className={`${ICON_BUTTON} hover:!text-red-600 hover:!bg-red-50`} title="Uitloggen" aria-label="Uitloggen">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="h-11 px-4 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 rounded-xl font-semibold flex items-center gap-2 transition-colors"
            >
              <LogIn size={18} className="text-emerald-600" />
              <span>Inloggen</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}

