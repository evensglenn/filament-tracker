import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, Edit2, Disc, Search, Filter, AlertCircle, Check, ArrowUp, ArrowDown, LogOut, LogIn, User, LayoutGrid, X, Share2, PackagePlus, UserPlus, Mail, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'motion/react';
import { Filament, FilamentType, FilamentFormData } from './types';
import { BAMBU_COLORS } from './constants';
import { filamentService } from './services/filamentService';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

const TYPES: FilamentType[] = ['PLA Basic', 'PLA Matte', 'PLA Glow', 'PETG-HF', 'PETG Basic', 'PLA-CF', 'PETG-CF', 'TPU'];

const getHue = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 2;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));

  // Achromatic colors (Black, Gray, White)
  if (s < 0.15) {
    // Sort by lightness: White -> Gray -> Black
    // Put them after chromatic colors
    return 10 + (1 - l); 
  }

  let h = 0;
  if (max === r) h = (g - b) / d;
  else if (max === g) h = (b - r) / d + 2;
  else if (max === b) h = (r - g) / d + 4;

  // Normalize so Red (around 0) is at the start
  if (h < -0.5) h += 6;
  
  return h;
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'color'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isShareViewOpen, setIsShareViewOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);
  const [newShareEmail, setNewShareEmail] = useState('');
  const [deliveryQuantities, setDeliveryQuantities] = useState<Record<string, number>>({});
  const [showHeader, setShowHeader] = useState(true);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setShowHeader(false);
    } else {
      setShowHeader(true);
    }
  });

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
      setError(null);
    }, (err: any) => {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error?.includes("insufficient permissions")) {
          setError("Je hebt geen toestemming om deze gegevens te bekijken.");
        } else {
          setError("Er is iets misgegaan bij het ophalen van de gegevens.");
        }
      } catch {
        setError("Er is iets misgegaan.");
      }
    });

    return () => unsubscribeFilaments();
  }, [isAuthReady, user]);

  useEffect(() => {
    if (user) {
      filamentService.getShares().then(setSharedEmails);
    }
  }, [user]);

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

  const handleAddShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShareEmail || sharedEmails.includes(newShareEmail)) return;
    const updated = [...sharedEmails, newShareEmail];
    setSharedEmails(updated);
    setNewShareEmail('');
    await filamentService.updateShares(updated);
  };

  const handleRemoveShare = async (email: string) => {
    const updated = sharedEmails.filter(e => e !== email);
    setSharedEmails(updated);
    await filamentService.updateShares(updated);
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

  const handleDeleteFromModal = () => {
    if (editingId) {
      setDeleteId(editingId);
      setIsModalOpen(false);
    }
  };

  const selectPreset = (name: string, hex: string) => {
    setFormData({ ...formData, colorName: name, colorHex: hex });
  };

  const incrementQuantity = async (filament: Filament) => {
    await filamentService.updateFilament(filament.id, {
      quantity: filament.quantity + 1
    });
  };

  const handleConfirmDelivery = async () => {
    const updates = Object.entries(deliveryQuantities).filter(([_, qty]) => (qty as number) > 0);
    if (updates.length === 0) {
      setIsQuickAddOpen(false);
      return;
    }

    try {
      for (const [id, qty] of updates) {
        const filament = filaments.find(f => f.id === id);
        if (filament) {
          await filamentService.updateFilament(id, {
            quantity: filament.quantity + (qty as number)
          });
        }
      }
      setDeliveryQuantities({});
      setIsQuickAddOpen(false);
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    }
  };

  const [formData, setFormData] = useState<FilamentFormData>({
    brand: 'Bambu Lab',
    type: 'PLA Basic',
    colorName: '',
    colorHex: '#000000',
    quantity: 1,
    notes: ''
  });

  const handleSort = (field: 'name' | 'quantity' | 'color') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder(field === 'quantity' ? 'desc' : 'asc'); // Default to desc for quantity
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
      } else if (sortBy === 'color') {
        comparison = getHue(a.colorHex) - getHue(b.colorHex);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold mb-4">Oeps!</h2>
          <p className="text-gray-600 mb-8">{error}</p>
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

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      {/* Header */}
      <motion.header 
        variants={{
          visible: { y: 0 },
          hidden: { y: "-100%" },
        }}
        animate={showHeader ? "visible" : "hidden"}
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
            {user ? (
              <>
                <button 
                  onClick={() => setIsQuickAddOpen(true)}
                  className="p-2.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all active:scale-95"
                  title="Snel toevoegen"
                >
                  <PackagePlus size={20} />
                </button>
                <button 
                  onClick={() => setIsShareModalOpen(true)}
                  className="p-2.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all active:scale-95 relative"
                  title="Delen met anderen"
                >
                  <UserPlus size={20} />
                  {sharedEmails.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                      {sharedEmails.length}
                    </span>
                  )}
                </button>
                <button 
                  onClick={handleLogout} 
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-95"
                  title="Uitloggen"
                >
                  <LogOut size={20} />
                </button>
              </>
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
      </motion.header>

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
            <div className="flex flex-col gap-5 mb-8">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                {/* Search Bar */}
                <div className="relative flex-1 lg:max-w-[240px]">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Zoek..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-[36px] pl-10 pr-4 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm font-medium text-xs"
                  />
                </div>

                <div className="flex flex-wrap gap-3 flex-1 lg:justify-end">
                  {/* Filter Button Bar */}
                  <div className="inline-flex p-1 bg-gray-100 rounded-xl shrink-0">
                    {['All', 'PLA', 'PETG'].map(option => (
                      <button 
                        key={option}
                        onClick={() => setFilterType(option)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${filterType === option ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {option === 'All' ? 'Alle' : option}
                      </button>
                    ))}
                  </div>

                  {/* Sort Button Bar */}
                  <div className="inline-flex p-1 bg-gray-100 rounded-xl shrink-0">
                    {[
                      { id: 'name', label: 'Naam' },
                      { id: 'color', label: 'Kleur' },
                      { id: 'quantity', label: 'Voorraad' }
                    ].map(sort => (
                      <button 
                        key={sort.id}
                        onClick={() => handleSort(sort.id as any)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${sortBy === sort.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        {sort.label}
                        {sortBy === sort.id && (sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Total Quantity & Spools - Moved below the bars on the right */}
              <div className="flex justify-end">
                <motion.button 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={`${filterType}-${searchQuery}`}
                  onClick={() => setIsShareViewOpen(true)}
                  className="flex items-center gap-3 shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
                  title="Deel dit overzicht"
                >
                  <div className="flex -space-x-2">
                    {filteredFilaments.slice(0, 5).map((f, i) => (
                      <div 
                        key={f.id} 
                        className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center"
                        style={{ backgroundColor: f.colorHex, zIndex: 5 - i }}
                      >
                        <Disc size={10} className="text-white/20" />
                      </div>
                    ))}
                    {filteredFilaments.length > 5 && (
                      <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[8px] font-black text-gray-400 z-0 shadow-sm">
                        +{filteredFilaments.length - 5}
                      </div>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-sm font-black text-gray-900">
                      {filteredFilaments.reduce((acc, f) => acc + f.quantity, 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Rollen</span>
                  </div>
                </motion.button>
              </div>
            </div>

        {/* Inventory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          <AnimatePresence mode="popLayout">
            {filteredFilaments.map((filament) => {
              return (
                <motion.div 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={filament.id}
                  onClick={() => openModal(filament)}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-xl hover:shadow-gray-200/50 transition-all group cursor-pointer flex"
                >
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div 
                        className="w-12 h-12 rounded-full border-4 border-gray-50 shadow-inner shrink-0"
                        style={{ backgroundColor: filament.colorHex }}
                      />
                      <div className="min-w-0">
                        <h3 className="font-bold text-lg leading-tight truncate" title={filament.colorName}>
                          {filament.colorName.split(' (')[0]}
                        </h3>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded uppercase tracking-wider inline-block">
                            {filament.type}
                          </span>
                          {user && filament.uid !== user.uid && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded uppercase tracking-wider inline-block">
                              {filament.ownerName || 'Gedeeld'}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest mt-0.5 truncate">
                          {filament.brand}
                        </p>
                      </div>
                    </div>
                    
                    {filament.notes && (
                      <div className="mt-3 text-[10px] text-gray-400 italic line-clamp-1">
                        {filament.notes}
                      </div>
                    )}
                  </div>

                  <div className={`w-14 flex flex-col items-center justify-center gap-1 transition-all shrink-0 ${getQuantityColor(filament.quantity)}`}>
                    <Disc size={18} />
                    <p className="text-xl font-black leading-none">{filament.quantity}</p>
                  </div>
                </motion.div>
              );
            })}

            {filteredFilaments.length === 0 && filaments.length > 0 && (
              <motion.div 
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full py-12 text-center"
              >
                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mx-auto mb-4">
                  <Search size={32} />
                </div>
                <p className="text-gray-500 font-bold">Geen resultaten gevonden</p>
                <p className="text-sm text-gray-400 mt-1">Probeer een andere zoekterm of filter.</p>
                {(searchQuery || filterType !== 'All') && (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <button 
                      onClick={() => { setSearchQuery(''); setFilterType('All'); }}
                      className="text-emerald-600 font-bold text-sm hover:underline py-1"
                    >
                      Wis alle filters
                    </button>
                    <button 
                      onClick={() => openModal()}
                      className="text-emerald-600 font-bold text-sm hover:underline py-1"
                    >
                      Voeg filament toe
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Add New Card */}
            {(filteredFilaments.length > 0 || filaments.length === 0) && (
              <motion.button
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => openModal()}
                className="group relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all min-h-[100px]"
              >
                <div className="w-10 h-10 bg-gray-50 group-hover:bg-emerald-100 rounded-full flex items-center justify-center text-gray-400 group-hover:text-emerald-600 transition-colors mb-2">
                  <Plus size={20} strokeWidth={3} />
                </div>
                <span className="text-xs font-bold text-gray-400 group-hover:text-emerald-600 transition-colors">Voeg toe</span>
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
                <h2 className="text-2xl font-bold mb-6">{editingId ? 'Bewerk' : 'Voeg toe'}</h2>
                
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

                  {editingId && (
                    <div className="pt-2 border-t border-gray-100 mt-4">
                      <button 
                        type="button"
                        onClick={handleDeleteFromModal}
                        className="w-full px-6 py-3 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Trash2 size={18} />
                        Verwijder
                      </button>
                    </div>
                  )}
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId !== null && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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

      {/* Share View Modal */}
      <AnimatePresence>
        {isShareViewOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareViewOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <LayoutGrid size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">Overzicht</h2>
                  </div>
                </div>
                <button onClick={() => setIsShareViewOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filteredFilaments.map(f => (
                    <div key={f.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center gap-2">
                      <div 
                        className="w-10 h-10 rounded-full border-2 border-gray-100 shadow-inner"
                        style={{ backgroundColor: f.colorHex }}
                      />
                      <div className="min-w-0 w-full">
                        <p className="text-[10px] font-black text-gray-900 truncate leading-tight uppercase tracking-tighter">
                          {f.colorName}
                        </p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                          {f.type}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quick Add Modal */}
      <AnimatePresence>
        {isQuickAddOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsQuickAddOpen(false);
                setDeliveryQuantities({});
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <PackagePlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">Nieuwe levering</h2>
                  </div>
                </div>
                <button onClick={() => {
                  setIsQuickAddOpen(false);
                  setDeliveryQuantities({});
                }} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {filaments.map(f => {
                    const pendingQty = deliveryQuantities[f.id] || 0;
                    return (
                      <div key={f.id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center gap-2 relative group">
                        <div 
                          className="w-10 h-10 rounded-full border-2 border-gray-100 shadow-inner"
                          style={{ backgroundColor: f.colorHex }}
                        />
                        <div className="min-w-0 w-full">
                          <p className="text-[10px] font-black text-gray-900 truncate leading-tight uppercase tracking-tighter">
                            {f.colorName}
                          </p>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            {f.type}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 mt-1">
                            Huidig: {f.quantity}
                          </p>
                          
                          <div className="mt-2 flex items-center justify-center gap-3">
                            <button 
                              onClick={() => setDeliveryQuantities(prev => ({ ...prev, [f.id]: Math.max(0, (prev[f.id] || 0) - 1) }))}
                              disabled={pendingQty === 0}
                              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${pendingQty > 0 ? 'border-red-200 text-red-600 hover:bg-red-50 active:scale-90' : 'border-gray-100 text-gray-300 cursor-not-allowed'}`}
                            >
                              <Minus size={16} strokeWidth={3} />
                            </button>
                            <span className={`text-lg font-black w-6 ${pendingQty > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                              {pendingQty}
                            </span>
                            <button 
                              onClick={() => setDeliveryQuantities(prev => ({ ...prev, [f.id]: (prev[f.id] || 0) + 1 }))}
                              className="w-8 h-8 rounded-full flex items-center justify-center border border-emerald-200 text-emerald-600 hover:bg-emerald-50 active:scale-90 transition-all"
                            >
                              <Plus size={16} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-white border-t border-gray-100 flex gap-3">
                <button 
                  onClick={() => {
                    setIsQuickAddOpen(false);
                    setDeliveryQuantities({});
                  }}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all active:scale-95"
                >
                  Annuleer
                </button>
                <button 
                  onClick={handleConfirmDelivery}
                  disabled={Object.values(deliveryQuantities).every(v => (v as number) === 0)}
                  className="flex-[2] px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Bewaar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Delen</h2>
                  <button onClick={() => setIsShareModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <p className="text-sm text-gray-500 mb-6">
                  Deel je filament voorraad met andere Google accounts. Zij kunnen je voorraad bekijken en bewerken.
                </p>

                <form onSubmit={handleAddShare} className="flex gap-2 mb-8">
                  <div className="relative flex-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="email@gmail.com"
                      value={newShareEmail}
                      onChange={e => setNewShareEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="px-4 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                  >
                    Voeg toe
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gedeeld met</h3>
                  {sharedEmails.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Nog met niemand gedeeld.</p>
                  ) : (
                    <div className="space-y-2">
                      {sharedEmails.map(email => (
                        <div key={email} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                          <span className="text-sm font-medium text-gray-700">{email}</span>
                          <button 
                            onClick={() => handleRemoveShare(email)}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Version Number */}
      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">
          Filament Tracker v2.0.0
        </p>
      </footer>
    </div>
  );
}
