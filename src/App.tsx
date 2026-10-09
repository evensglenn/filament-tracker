import { useMemo, useState } from 'react';
import { Filament } from './types';
import { filamentService } from './services/filamentService';
import { useAuth } from './hooks/useAuth';
import { useDataMigration } from './hooks/useDataMigration';
import { useFilaments } from './hooks/useFilaments';
import { useFilamentFilters } from './hooks/useFilamentFilters';
import { useUserConfig } from './hooks/useUserConfig';
import { useHideOnScroll } from './hooks/useHideOnScroll';
import { toInventory } from './utils/filaments';
import { Header } from './components/Header';
import { ErrorScreen, LoadingScreen, LoginScreen } from './components/StatusScreens';
import { Toolbar } from './components/inventory/Toolbar';
import { FilamentGrid } from './components/inventory/FilamentGrid';
import { FilamentFormModal } from './components/modals/FilamentFormModal';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal';
import { OverviewModal } from './components/modals/OverviewModal';
import { DeliveryModal } from './components/modals/DeliveryModal';
import { PrintModal } from './components/modals/PrintModal';
import { SettingsModal } from './components/settings/SettingsModal';

type ActiveModal = 'form' | 'settings' | 'overview' | 'delivery' | 'print' | null;

export default function App() {
  const { user, isAuthReady, login, logout } = useAuth();
  const { isReady, error: migrationError } = useDataMigration(user);
  const { filaments: filamentDocs, error: filamentsError } = useFilaments(user, isReady);
  const { config, actions: configActions } = useUserConfig(user, isReady);
  const filaments = useMemo(() => toInventory(filamentDocs, config?.types ?? []), [filamentDocs, config]);
  const typeUsage = useMemo(() => {
    const usage = new Map<string, number>();
    filamentDocs.forEach(f => usage.set(f.typeId, (usage.get(f.typeId) ?? 0) + 1));
    return usage;
  }, [filamentDocs]);
  const filters = useFilamentFilters(filaments);
  const showHeader = useHideOnScroll();

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);

  const openForm = (filament?: Filament) => {
    setEditingFilament(filament ?? null);
    setActiveModal('form');
  };

  const requestDelete = (id: string) => {
    setDeleteId(id);
    closeModal();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await filamentService.deleteFilament(deleteId);
    setDeleteId(null);
  };

  const error = migrationError ?? filamentsError;
  if (error) {
    return <ErrorScreen message={error} />;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#111827] font-sans">
      <Header
        visible={showHeader}
        isLoggedIn={!!user}
        onLogin={login}
        onLogout={logout}
        onNewPrint={() => setActiveModal('print')}
        onNewDelivery={() => setActiveModal('delivery')}
        onOpenSettings={() => setActiveModal('settings')}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {!isAuthReady || (user && !isReady) ? (
          <LoadingScreen />
        ) : !user ? (
          <LoginScreen onLogin={login} />
        ) : (
          <>
            <Toolbar filters={filters} onOpenOverview={() => setActiveModal('overview')} />
            <FilamentGrid
              filaments={filters.filtered}
              hasInventory={filaments.length > 0}
              isFiltered={filters.isFiltered}
              onEdit={openForm}
              onAdd={() => openForm()}
              onResetFilters={filters.resetFilters}
            />
          </>
        )}
      </main>

      <FilamentFormModal
        isOpen={activeModal === 'form'}
        filament={editingFilament}
        types={config?.types ?? []}
        onClose={closeModal}
        onRequestDelete={requestDelete}
      />

      <SettingsModal
        isOpen={activeModal === 'settings'}
        onClose={closeModal}
        config={config}
        configActions={configActions}
        typeUsage={typeUsage}
      />

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <OverviewModal isOpen={activeModal === 'overview'} onClose={closeModal} filaments={filters.filtered} />
      <DeliveryModal isOpen={activeModal === 'delivery'} onClose={closeModal} filaments={filaments} />
      <PrintModal isOpen={activeModal === 'print'} onClose={closeModal} filaments={filaments} />

      <footer className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
        <p className="text-[10px] text-gray-400 font-mono uppercase tracking-[0.2em]">
          Filament Tracker v2.0.0
        </p>
      </footer>
    </div>
  );
}
