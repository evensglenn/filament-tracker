/** Firebase error codes that mean the server could not be reached. */
const CONNECTION_CODES = ['unavailable', 'deadline-exceeded', 'auth/network-request-failed'];

/** Sign-in popups the user closed or that were replaced by a new one: not an error. */
const CANCELLED_CODES = ['auth/popup-closed-by-user', 'auth/cancelled-popup-request'];

const codeOf = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error ? String((error as { code: unknown }).code) : '';

export const isCancelledSignIn = (error: unknown) => CANCELLED_CODES.includes(codeOf(error));

/** A short Dutch explanation of why an action failed, for a message to the user. */
export function describeError(error: unknown): string {
  const code = codeOf(error);
  if (CONNECTION_CODES.includes(code) || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return 'Geen verbinding met de server. Controleer je internet en probeer het opnieuw.';
  }
  if (code === 'permission-denied') {
    return 'Dit mocht niet worden opgeslagen. Log opnieuw in en probeer het nog eens.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Je browser blokkeerde het inlogvenster. Sta pop-ups toe voor deze site en probeer het opnieuw.';
  }
  return 'Er ging iets mis. Probeer het opnieuw.';
}

/** An error with a Firebase-style code, e.g. to fail fast when there is no connection. */
export function codedError(code: string, message: string) {
  return Object.assign(new Error(message), { code });
}
