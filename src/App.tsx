import { useEffect, useMemo, useRef, useState } from 'react';
import { Filament } from './types';
import { filamentService } from './services/filamentService';
import { useAuth } from './hooks/useAuth';
import { useAccountSetup } from './hooks/useAccountSetup';
import { useFilaments } from './hooks/useFilaments';
import { useFilamentFilters } from './hooks/useFilamentFilters';
import { useUserConfig } from './hooks/useUserConfig';
import { useHideOnScroll } from './hooks/useHideOnScroll';
import { useHashRoute } from './hooks/useHashRoute';
import { isAlmostEmpty, toInventory } from './utils/filaments';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ErrorScreen, LoadingScreen, LoginScreen } from './components/StatusScreens';
import { Toolbar } from './components/inventory/Toolbar';
import { FilamentGrid } from './components/inventory/FilamentGrid';
import { FilamentFormModal } from './components/modals/FilamentFormModal';
import { DeleteConfirmModal } from './components/modals/DeleteConfirmModal';
import { DeliveryModal } from './components/modals/DeliveryModal';
import { PrintModal } from './components/modals/PrintModal';
import { SettingsPage } from './components/settings/SettingsPage';
import { useShowError } from './components/ui/Toast';

type ActiveModal = 'form' | 'delivery' | 'print' | null;

export default function App() {
  const { user, isAuthReady, login, logout } = useAuth();
  const { isReady, error: accountError } = useAccountSetup(user);
  const { filaments: filamentDocs, error: filamentsError } = useFilaments(user, isReady);
  const { config, actions: configActions } = useUserConfig(user, isReady);
  const filaments = useMemo(() => toInventory(filamentDocs, config?.types ?? []), [filamentDocs, config]);
  const typeUsage = useMemo(() => {
    const usage = new Map<string, number>();
    filamentDocs.forEach(f => usage.set(f.typeId, (usage.get(f.typeId) ?? 0) + 1));
    return usage;
  }, [filamentDocs]);
  const lowCount = filaments.filter(isAlmostEmpty).length;
  const filters = useFilamentFilters(filaments);
  const showHeader = useHideOnScroll();

  const { route, navigate } = useHashRoute();
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);

  // Save pending type edits when leaving the settings page
  const previousView = useRef(route.view);
  useEffect(() => {
    if (previousView.current === 'settings' && route.view !== 'settings') configActions.flush();
    previousView.current = route.view;
    window.scrollTo(0, 0);
  }, [route.view]);
  const [editingFilament, setEditingFilament] = useState<Filament | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const showError = useShowError();

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
    try {
      await filamentService.deleteFilament(deleteId);
      setDeleteId(null);
    } catch (error) {
      // The question stays open, so deleting can simply be retried
      showError('Verwijderen', error);
    }
  };

  const error = accountError ?? filamentsError;
  if (error) {
    return <ErrorScreen message={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans">
      <Header
        visible={showHeader}
        isLoggedIn={!!user}
        onLogin={login}
        onLogout={logout}
        onNewPrint={() => setActiveModal('print')}
        onNewDelivery={() => setActiveModal('delivery')}
        onOpenSettings={() => navigate({ view: 'settings' })}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {!isAuthReady || (user && !isReady) ? (
          <LoadingScreen />
        ) : !user ? (
          <LoginScreen onLogin={login} />
        ) : route.view === 'settings' ? (
          <SettingsPage
            types={config?.types ?? []}
            usage={typeUsage}
            actions={configActions}
            selectedTypeId={route.typeId}
            onSelectType={typeId => navigate({ view: 'settings', typeId })}
            onBack={() => navigate({ view: 'inventory' })}
          />
        ) : (
          <>
            <Toolbar filters={filters} lowCount={lowCount} />
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

      <DeleteConfirmModal
        isOpen={deleteId !== null}
        onCancel={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />

      <DeliveryModal isOpen={activeModal === 'delivery'} onClose={closeModal} filaments={filaments} />
      <PrintModal isOpen={activeModal === 'print'} onClose={closeModal} filaments={filaments} />

      <Footer />
    </div>
  );
}
