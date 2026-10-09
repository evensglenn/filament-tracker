import { useEffect, useState } from 'react';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../firebase';
import { useShowError } from '../components/ui/Toast';
import { isCancelledSignIn } from '../utils/errors';

export function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const showError = useShowError();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribeAuth();
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      if (!isCancelledSignIn(error)) showError('Inloggen', error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      showError('Uitloggen', error);
    }
  };

  return { user, isAuthReady, login, logout };
}
