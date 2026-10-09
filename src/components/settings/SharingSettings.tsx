import { FormEvent, useState } from 'react';
import { Mail, Share2, Trash2 } from 'lucide-react';

interface SharingSettingsProps {
  sharedEmails: string[];
  onAdd: (email: string) => void;
  onRemove: (email: string) => void;
}

export function SharingSettings({ sharedEmails, onAdd, onRemove }: SharingSettingsProps) {
  const [newEmail, setNewEmail] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newEmail || sharedEmails.includes(newEmail)) return;
    setNewEmail('');
    onAdd(newEmail);
  };

  return (
    <section>
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Share2 size={18} className="text-emerald-600" />
        Delen met anderen
      </h3>
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
        <p className="text-sm text-gray-500 mb-4">
          Voeg e-mailadressen toe van mensen die jouw voorraad mogen inzien.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="email"
              placeholder="e-mailadres..."
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-200"
          >
            Toevoegen
          </button>
        </form>

        <div className="space-y-2">
          {sharedEmails.map(email => (
            <div key={email} className="flex items-center justify-between bg-white px-4 py-2 rounded-xl border border-gray-100 group">
              <span className="text-sm font-medium text-gray-700">{email}</span>
              <button
                onClick={() => onRemove(email)}
                className="text-gray-400 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sharedEmails.length === 0 && (
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center py-2">
              Nog geen toegang gedeeld
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
