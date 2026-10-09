import { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { configService } from '../services/configService';

/** Makes sure the user's account document exists before anything loads data. */
export function useAccountSetup(user: FirebaseUser | null) {
  const [readyUid, setReadyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    configService.ensureAccount(user.uid)
      .then(() => { if (!cancelled) setReadyUid(user.uid); })
      .catch((err) => {
        console.error('Account setup failed:', err);
        if (!cancelled) setError("Je account kon niet worden geladen.");
      });

    return () => { cancelled = true; };
  }, [user]);

  return { isReady: !!user && readyUid === user.uid, error };
}
