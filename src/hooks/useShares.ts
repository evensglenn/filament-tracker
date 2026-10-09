import { useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { filamentService } from '../services/filamentService';

export function useShares(user: FirebaseUser | null) {
  const [sharedEmails, setSharedEmails] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      filamentService.getShares().then(setSharedEmails);
    }
  }, [user]);

  const addShare = async (email: string) => {
    if (!email || sharedEmails.includes(email)) return;
    const updated = [...sharedEmails, email];
    setSharedEmails(updated);
    await filamentService.updateShares(updated);
  };

  const removeShare = async (email: string) => {
    const updated = sharedEmails.filter(e => e !== email);
    setSharedEmails(updated);
    await filamentService.updateShares(updated);
  };

  return { sharedEmails, addShare, removeShare };
}
