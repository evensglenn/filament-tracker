import { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Filament } from '../types';
import { filamentService } from '../services/filamentService';

export function useFilaments(user: FirebaseUser | null, isAuthReady: boolean) {
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [error, setError] = useState<string | null>(null);

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

  return { filaments, error };
}
