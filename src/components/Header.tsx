import { motion } from 'motion/react';
import { Disc, LogIn, PackagePlus, Printer, Settings } from 'lucide-react';

interface HeaderProps {
  visible: boolean;
  isLoggedIn: boolean;
  onLogin: () => void;
  onNewPrint: () => void;
  onNewDelivery: () => void;
  onOpenSettings: () => void;
}

const ICON_BUTTON = 'w-11 h-11 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors';

export function Header({ visible, isLoggedIn, onLogin, onNewPrint, onNewDelivery, onOpenSettings }: HeaderProps) {
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shrink-0">
            <Disc size={20} />
          </div>
          <h1 className="text-lg font-bold tracking-tight whitespace-nowrap">Filament tracker</h1>
        </div>

        <div className="flex items-center gap-1">
          {isLoggedIn ? (
            <>
              {/* On phones the print button lives at the bottom of the screen */}
              <button
                onClick={onNewPrint}
                className="hidden sm:flex items-center gap-2 h-11 px-4 mr-1 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
              >
                <Printer size={18} />
                Print registreren
              </button>
              <button onClick={onNewDelivery} className={ICON_BUTTON} title="Levering registreren" aria-label="Levering registreren">
                <PackagePlus size={20} />
              </button>
              <button onClick={onOpenSettings} className={ICON_BUTTON} title="Instellingen" aria-label="Instellingen">
                <Settings size={20} />
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

/** Primary action on phones: always within thumb reach at the bottom of the screen. */
export function MobilePrintButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="sm:hidden fixed inset-x-0 bottom-0 z-30 px-4 pt-6 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#F9FAFB] via-[#F9FAFB]/90 to-transparent pointer-events-none">
      <button
        onClick={onClick}
        className="pointer-events-auto w-full h-14 flex items-center justify-center gap-2 bg-emerald-600 text-white text-base font-bold rounded-2xl shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-transform"
      >
        <Printer size={20} />
        Print registreren
      </button>
    </div>
  );
}
