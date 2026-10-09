import { useEffect, useState } from 'react';

const CHECK_EVERY_MS = 30 * 60 * 1000;

/** The version that is online now, from the version.json each deploy writes (see vite.config.ts). */
async function fetchOnlineVersion(): Promise<string | undefined> {
  try {
    // A unique address and no-store, so neither GitHub's cache nor the browser's answers
    const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) return undefined;
    const { version } = await response.json();
    return typeof version === 'string' ? version : undefined;
  } catch {
    // Offline, or no version.json (the dev server answers with the page itself)
    return undefined;
  }
}

/**
 * The newer version that is online, if any. An installed app often stays open in the background
 * for days, so it checks whenever it comes back to the front and every half hour while open.
 */
export function useUpdateCheck() {
  const [newVersion, setNewVersion] = useState<string>();

  useEffect(() => {
    const check = async () => {
      const online = await fetchOnlineVersion();
      if (online && online !== __APP_VERSION__) setNewVersion(online);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };

    check();
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  return newVersion;
}
