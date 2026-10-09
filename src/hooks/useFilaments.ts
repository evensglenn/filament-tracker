import { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { FilamentDoc } from '../types';
import { filamentService } from '../services/filamentService';

export function useFilaments(user: FirebaseUser | null, isReady: boolean) {
  const [filaments, setFilaments] = useState<FilamentDoc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !user) {
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
  }, [isReady, user]);

  return { filaments, error };
}
