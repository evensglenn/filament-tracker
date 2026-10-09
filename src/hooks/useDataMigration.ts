import { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { ensureMigrated } from '../services/migrationService';

/** Makes sure the user's data is in the current Firestore layout before anything loads it. */
export function useDataMigration(user: FirebaseUser | null) {
  const [readyUid, setReadyUid] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    ensureMigrated(user.uid)
      .then(() => { if (!cancelled) setReadyUid(user.uid); })
      .catch((err) => {
        console.error('Migration failed:', err);
        if (!cancelled) setError("Je gegevens konden niet worden bijgewerkt naar de nieuwe versie.");
      });

    return () => { cancelled = true; };
  }, [user]);

  return { isReady: !!user && readyUid === user.uid, error };
}
