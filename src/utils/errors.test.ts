import { afterEach, describe, expect, it, vi } from 'vitest';
import { codedError, describeError, isCancelledSignIn } from './errors';

describe('describeError', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('explains a missing connection', () => {
    expect(describeError(codedError('unavailable', 'x'))).toMatch(/Geen verbinding/);
    expect(describeError(codedError('auth/network-request-failed', 'x'))).toMatch(/Geen verbinding/);
  });

  it('blames the connection when the device is offline, whatever the error', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(describeError(new Error('?'))).toMatch(/Geen verbinding/);
  });

  it('explains refused writes and blocked popups', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(describeError(codedError('permission-denied', 'x'))).toMatch(/Log opnieuw in/);
    expect(describeError(codedError('auth/popup-blocked', 'x'))).toMatch(/pop-ups/);
  });

  it('falls back to a generic message', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(describeError(new Error('?'))).toBe('Er ging iets mis. Probeer het opnieuw.');
  });
});

describe('isCancelledSignIn', () => {
  it('treats a closed sign-in popup as no error', () => {
    expect(isCancelledSignIn(codedError('auth/popup-closed-by-user', 'x'))).toBe(true);
    expect(isCancelledSignIn(codedError('auth/popup-blocked', 'x'))).toBe(false);
  });
});
