import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import { collection, connectFirestoreEmulator, doc, getFirestore } from 'firebase/firestore';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Local development and tests against the Firebase emulators (`VITE_USE_EMULATORS=true`)
if (import.meta.env?.VITE_USE_EMULATORS === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
}

// Firestore layout: everything a user owns lives under users/{uid}
export const paths = {
  user: (uid: string) => doc(db, 'users', uid),
  filaments: (uid: string) => collection(db, 'users', uid, 'filaments'),
  filament: (uid: string, id: string) => doc(db, 'users', uid, 'filaments', id),
  prints: (uid: string) => collection(db, 'users', uid, 'prints'),
};
