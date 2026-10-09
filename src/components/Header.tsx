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

export function Header({ visible, isLoggedIn, onLogin, onLogout, onNewPrint, onNewDelivery, onOpenSettings }: HeaderProps) {
  return (
    <motion.header
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={visible ? "visible" : "hidden"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="bg-white border-b border-gray-200 sticky top-0 z-40"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <Disc size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Filament tracker</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <button
                onClick={onNewPrint}
                className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all active:scale-95"
                title="Nieuwe print"
              >
                <Printer size={20} />
              </button>
              <button
                onClick={onNewDelivery}
                className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all active:scale-95"
                title="Snel toevoegen"
              >
                <PackagePlus size={20} />
              </button>
              <button
                onClick={onOpenSettings}
                className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95"
                title="Instellingen"
              >
                <Settings size={20} />
              </button>
              <button
                onClick={onLogout}
                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                title="Uitloggen"
              >
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <button
              onClick={onLogin}
              className="bg-white border border-gray-200 hover:border-emerald-500 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
            >
              <LogIn size={20} className="text-emerald-600" />
              <span>Inloggen</span>
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
