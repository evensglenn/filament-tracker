import { Disc, LogIn, ShieldAlert } from 'lucide-react';

export function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold mb-4">Oeps!</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95"
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
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-500 font-medium">Laden...</p>
    </div>
  );
}

export function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-6">
        <Disc size={40} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom bij Filament Tracker</h2>
      <p className="text-gray-500 max-w-md mb-8">
        Log in om je filament voorraad te beheren en te synchroniseren tussen al je apparaten.
      </p>
      <button
        onClick={onLogin}
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-200"
      >
        <LogIn size={20} />
        Inloggen met Google
      </button>
    </div>
  );
}
