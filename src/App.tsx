import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Disc, ChevronRight, Search, Filter, AlertCircle, Check, ArrowUp, ArrowDown, LogOut, LogIn, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Filament, FilamentType, FilamentFormData } from './types';
import { BAMBU_COLORS } from './constants';
import { filamentService } from './services/filamentService';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const TYPES: FilamentType[] = ['PLA Basic', 'PLA Matte', 'PLA Glow', 'PETG-HF', 'PETG Basic', 'PLA-CF', 'PETG-CF', 'TPU', 'Other'];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !user) {
      setFilaments([]);
      return;
    }

    const unsubscribeFilaments = filamentService.subscribeToFilaments((data) => {
      setFilaments(data);
    });

    return () => unsubscribeFilaments();
  }, [isAuthReady, user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await filamentService.updateFilament(editingId, formData);
    } else {
      await filamentService.addFilament(formData);
    }
    closeModal();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await filamentService.deleteFilament(deleteId);
    setDeleteId(null);
  };

  const openModal = (filament?: Filament) => {
    if (filament) {
      setEditingId(filament.id);
      setFormData({
        brand: filament.brand,
        type: filament.type,
        colorName: filament.colorName,
        colorHex: filament.colorHex,
        quantity: filament.quantity,
        notes: filament.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        brand: 'Bambu Lab',
        type: 'PLA Basic',
        colorName: '',
        colorHex: '#000000',
        quantity: 1,
        notes: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const selectPreset = (name: string, hex: string) => {
    setFormData({ ...formData, colorName: name, colorHex: hex });
  };

  const incrementQuantity = async (filament: Filament) => {
    await filamentService.updateFilament(filament.id, {
      quantity: filament.quantity + 1
    });
  };

  const [formData, setFormData] = useState<FilamentFormData>({
    brand: 'Bambu Lab',
    type: 'PLA Basic',
    colorName: '',
    colorHex: '#000000',
    quantity: 1,
    notes: ''
  });

  const handleSort = (field: 'name' | 'quantity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'name' ? 'asc' : 'desc'); // Default to desc for quantity
    }
  };

  const filteredFilaments = filaments
    .filter(f => {
      const matchesSearch = f.colorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           f.brand.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesType = false;
      if (filterType === 'All') {
        matchesType = true;
      } else if (filterType === 'PLA') {
        matchesType = f.type.startsWith('PLA');
      } else if (filterType === 'PETG') {
        matchesType = f.type.startsWith('PETG');
      } else if (filterType === 'Other') {
        matchesType = f.type === 'Other' || f.type === 'TPU';
      }

      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.colorName.localeCompare(b.colorName);
      } else {
        comparison = a.quantity - b.quantity;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getQuantityColor = (qty: number) => {
    if (qty < 0.25) return 'text-red-600 bg-red-50';
    if (qty < 0.75) return 'text-amber-600 bg-amber-50';
    return 'text-emerald-600 bg-emerald-50';
  };

  const presets = BAMBU_COLORS[formData.type] || [];

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <Disc size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Filament tracker</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold text-gray-900">{user.displayName}</span>
                  <button onClick={handleLogout} className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider">Uitloggen</button>
                </div>
                <button onClick={handleLogout} className="sm:hidden p-2 text-gray-400 hover:text-red-500">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="bg-white border border-gray-200 hover:border-emerald-500 text-gray-700 px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-sm"
              >
                <LogIn size={20} className="text-emerald-600" />
                <span>Inloggen</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!isAuthReady ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Laden...</p>
          </div>
        ) : !user ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mb-6">
              <Disc size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welkom bij Filament Tracker</h2>
            <p className="text-gray-500 max-w-md mb-8">
              Log in om je filament voorraad te beheren en te synchroniseren tussen al je apparaten.
            </p>
            <button 
              onClick={handleLogin}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-200"
            >
              <LogIn size={20} />
              Inloggen met Google
            </button>
          </div>
        ) : (
          <>
            {/* Filters & Search */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Zoek op kleur of merk..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-[46px] pl-10 pr-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleSort('name')}
                className={`px-4 h-[46px] rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border ${sortBy === 'name' ? 'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-900 hover:bg-gray-50'}`}
              >
                Naam
                {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
              </button>
              <button 
                onClick={() => handleSort('quantity')}
                className={`px-4 h-[46px] rounded-xl text-sm font-bold transition-all flex items-center gap-1.5 border ${sortBy === 'quantity' ? 'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-900 hover:bg-gray-50'}`}
              >
                Voorraad
                {sortBy === 'quantity' && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
              </button>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            {['All', 'PLA', 'PETG', 'Other'].map(option => (
              <button 
                key={option}
                onClick={() => setFilterType(option)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all border ${filterType === option ? 'bg-gray-900 border-gray-900 text-white shadow-lg shadow-gray-200' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-900 hover:bg-gray-50'}`}
              >
                {option === 'All' ? 'Alle' : option === 'Other' ? 'Overig' : option}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredFilaments.map((filament) => {
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={filament.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-4 gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-12 h-12 rounded-full border-4 border-gray-50 shadow-inner shrink-0"
                          style={{ backgroundColor: filament.colorHex }}
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg leading-tight truncate" title={filament.colorName}>
                            {filament.colorName.split(' (')[0]}
                          </h3>
                          <div className="mt-1">
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider inline-block">
                              {filament.type}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 truncate">
                            {filament.brand}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openModal(filament)}
                          className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeleteId(filament.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className={`p-4 rounded-2xl flex flex-col items-center justify-center border border-transparent transition-all relative group/qty ${getQuantityColor(filament.quantity)}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <Disc size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider">Voorraad</span>
                        </div>
                        <p className="text-3xl font-black">{filament.quantity} <span className="text-lg font-bold">{filament.quantity === 1 ? 'rol' : 'rollen'}</span></p>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            incrementQuantity(filament);
                          }}
                          className="absolute -right-2 -top-2 w-10 h-10 bg-white border border-gray-200 text-emerald-600 rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all md:opacity-0 md:group-hover/qty:opacity-100"
                          title="+1 rol toevoegen"
                        >
                          <Plus size={24} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {filament.notes && (
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500 italic">
                      {filament.notes}
                    </div>
                  )}
                </motion.div>
              );
            })}

            {filteredFilaments.length === 0 && filaments.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full py-12 text-center"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                  <Search size={32} />
                </div>
                <p className="text-gray-500 font-bold">Geen resultaten gevonden</p>
                <p className="text-sm text-gray-400 mt-1">Probeer een andere zoekterm of filter.</p>
                {(searchQuery || filterType !== 'All') && (
                  <button 
                    onClick={() => { setSearchQuery(''); setFilterType('All'); }}
                    className="mt-4 text-emerald-600 font-bold text-sm hover:underline"
                  >
                    Wis alle filters
                  </button>
                )}
              </motion.div>
            )}

            {/* Add New Card */}
            {true && (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => openModal()}
                className="group relative flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all min-h-[200px]"
              >
                <div className="w-12 h-12 bg-gray-50 group-hover:bg-emerald-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors mb-3">
                  <Plus size={24} strokeWidth={3} />
                </div>
                <span className="text-sm font-bold text-gray-400 group-hover:text-emerald-600 transition-colors">Voeg toe</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
          </>
        )}
      </main>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-6">{editingId ? 'Bewerken' : 'Voeg toe'}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Merk</label>
                      <input 
                        type="text" 
                        required
                        value={formData.brand}
                        onChange={e => setFormData({...formData, brand: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Type</label>
                      <select 
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value as FilamentType})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      >
                        {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Preset Colors */}
                  {presets.length > 0 && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Bambu Lab Presets</label>
                      <div className="flex flex-wrap gap-2">
                        {presets.map(preset => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => selectPreset(preset.name, preset.hex)}
                            className={`group relative w-8 h-8 rounded-full border-2 transition-all ${formData.colorHex === preset.hex ? 'border-emerald-500 scale-110 shadow-md' : 'border-transparent hover:scale-110'}`}
                            style={{ backgroundColor: preset.hex }}
                            title={preset.name}
                          >
                            {formData.colorHex === preset.hex && (
                              <Check size={14} className={`absolute inset-0 m-auto ${preset.hex === '#F5F5F5' || preset.hex === '#FFFFFF' ? 'text-gray-900' : 'text-white'}`} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kleurnaam</label>
                      <input 
                        type="text" 
                        required
                        placeholder="bijv. Jade White"
                        value={formData.colorName}
                        onChange={e => setFormData({...formData, colorName: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Kleur</label>
                      <div className="flex items-center gap-2 h-[46px]">
                        <input 
                          type="color" 
                          value={formData.colorHex}
                          onChange={e => setFormData({...formData, colorHex: e.target.value})}
                          className="w-12 h-full p-1 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer"
                        />
                        <span className="text-xs font-mono text-gray-400 uppercase">{formData.colorHex}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Aantal Rollen</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="range" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                        className="flex-1 h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                      />
                      <input 
                        type="number" 
                        step="0.1"
                        min="0"
                        value={formData.quantity}
                        onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                        className="w-24 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notities</label>
                    <textarea 
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      rows={2}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                    >
                      Annuleer
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                    >
                      {editingId ? 'Bewaar' : 'Voeg toe'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden p-8 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2">Weet je het zeker?</h3>
              <p className="text-gray-500 mb-8">Dit filament wordt definitief verwijderd uit je voorraad. Dit kan niet ongedaan worden gemaakt.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                >
                  Annuleer
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-100"
                >
                  Verwijder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Version Number */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">
          Filament Tracker v1.5.0
        </p>
      </footer>
    </div>
  );
}
