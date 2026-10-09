import { useEffect, useState } from 'react';

export type Route =
  | { view: 'inventory' }
  | { view: 'settings'; typeId?: string };

const parse = (hash: string): Route => {
  const [view, typeId] = hash.replace(/^#\/?/, '').split('/');
  if (view === 'instellingen') return { view: 'settings', typeId: typeId ? decodeURIComponent(typeId) : undefined };
  return { view: 'inventory' };
};

const toHash = (route: Route) =>
  route.view === 'settings' ? `#instellingen${route.typeId ? `/${encodeURIComponent(route.typeId)}` : ''}` : '';

/**
 * The current page, kept in the address (#instellingen, #instellingen/<type>), so the browser's
 * and phone's back button work and a page survives a reload. GitHub Pages serves one file, so a
 * hash is the simplest way to have pages.
 */
export function useHashRoute() {
  const [route, setRoute] = useState<Route>(() => parse(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(parse(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: Route) => {
    const hash = toHash(next);
    if (hash) {
      window.location.hash = hash;
    } else {
      // Back to the inventory without leaving a bare "#" in the address
      history.pushState(null, '', window.location.pathname + window.location.search);
      setRoute(next);
    }
  };

  return { route, navigate };
}
