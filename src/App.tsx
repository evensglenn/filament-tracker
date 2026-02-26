import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Package, Scale, Droplets, ChevronRight, Search, Filter, AlertCircle, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Filament, FilamentType, FilamentFormData } from './types';
import { BAMBU_COLORS } from './constants';

const TYPES: FilamentType[] = ['PLA', 'PETG', 'PLA-CF', 'PETG-CF', 'TPU', 'Other'];

export default function App() {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilamentType | 'All'>('All');
  
  const [formData, setFormData] = useState<FilamentFormData>({
    brand: 'Bambu Lab',
    type: 'PLA',
    colorName: '',
    colorHex: '#000000',
    quantity: 1,
    notes: ''
  });

  useEffect(() => {
    fetchFilaments();
  }, []);

  const fetchFilaments = async () => {
    try {
      const res = await fetch('/api/filaments');
      const data = await res.json();
      setFilaments(data);
    } catch (err) {
      console.error('Laden van filamenten mislukt', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/filaments/${editingId}` : '/api/filaments';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        fetchFilaments();
        closeModal();
      }
    } catch (err) {
      console.error('Opslaan van filament mislukt', err);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/filaments/${deleteId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchFilaments();
        setDeleteId(null);
      }
    } catch (err) {
      console.error('Verwijderen van filament mislukt', err);
    }
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
        type: 'PLA',
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
    try {
      const updatedQuantity = filament.quantity + 1;
      const res = await fetch(`/api/filaments/${filament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...filament,
          quantity: updatedQuantity
        }),
      });
      
      if (res.ok) {
        fetchFilaments();
      }
    } catch (err) {
      console.error('Verhogen van voorraad mislukt', err);
    }
  };

  const filteredFilaments = filaments.filter(f => {
    const matchesSearch = f.colorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         f.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || f.type === filterType;
    return matchesSearch && matchesType;
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
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Filament Tracker</h1>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Bambu Lab Voorraad</p>
            </div>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-emerald-100"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Voeg spoel toe</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Zoek op kleur of merk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button 
              onClick={() => setFilterType('All')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterType === 'All' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
            >
              Alle
            </button>
            {TYPES.map(type => (
              <button 
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterType === type ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}
              >
                {type}
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
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-full border-4 border-gray-50 shadow-inner"
                          style={{ backgroundColor: filament.colorHex }}
                        />
                        <div>
                          <h3 className="font-bold text-lg leading-tight">{filament.colorName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-600 rounded uppercase tracking-wider">
                              {filament.type}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              {filament.brand}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          <Package size={18} />
                          <span className="text-xs font-bold uppercase tracking-wider">Voorraad</span>
                        </div>
                        <p className="text-3xl font-black">{filament.quantity} <span className="text-lg font-bold">rollen</span></p>
                        
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
          </AnimatePresence>
        </div>

        {filteredFilaments.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Package size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Geen filamenten gevonden</h3>
            <p className="text-gray-500 mt-2">Pas je zoekopdracht aan of voeg een nieuwe spoel toe.</p>
          </div>
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
                <h2 className="text-2xl font-bold mb-6">{editingId ? 'Spoel bewerken' : 'Voeg nieuwe spoel toe'}</h2>
                
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
                      {editingId ? 'Sla op' : 'Voeg spoel toe'}
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

      {/* Low Stock Warning */}
      {filaments.some(f => f.quantity < 0.5) && (
        <div className="fixed bottom-6 right-6 z-40">
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-xl flex items-center gap-3 max-w-xs"
          >
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-white shrink-0">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">Lage Voorraad Alert</p>
              <p className="text-xs text-amber-700">Sommige van je spoelen raken bijna op (minder dan 0.5 rol).</p>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
