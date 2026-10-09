import { LogIn, ShieldAlert } from 'lucide-react';
import { AppIcon } from './ui/AppIcon';
import { ATTENTION } from './ui/Modal';

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-danger-soft text-danger rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-4">Oeps!</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-petrol-600 text-white font-bold rounded-xl hover:bg-petrol-700 transition-all active:scale-95"
        >
          Probeer opnieuw
        </button>
      </div>
    </div>
  );
}

export function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-petrol-500/20 border-t-petrol-500 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 dark:text-gray-400 font-medium">Laden...</p>
    </div>
  );
}

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <AppIcon className="w-20 h-20 mb-6" />
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welkom bij Filament tracker</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Log in om je filament voorraad te beheren en te synchroniseren tussen al je apparaten.
      </p>
      <button
        onClick={onLogin}
        className={`bg-petrol-600 hover:bg-petrol-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-petrol-200 dark:shadow-petrol-950 ${ATTENTION}`}
      >
        <LogIn size={20} />
        Log in met Google
      </button>
    </div>
  );
}
