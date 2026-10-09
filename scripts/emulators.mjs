#!/usr/bin/env node
// Runs a command against the Firebase emulators (Auth + Firestore), which need Java 21+.
//
//   node scripts/emulators.mjs dev    the app against the emulators, with test data
//   node scripts/emulators.mjs test   all tests, including the Firestore ones
import { execFileSync, spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

const COMMANDS = {
  dev: 'node scripts/seed-emulator.mjs && vite',
  test: 'vitest run',
};

const mode = process.argv[2];
if (!COMMANDS[mode]) {
  console.error(`Gebruik: node scripts/emulators.mjs <${Object.keys(COMMANDS).join('|')}>`);
  process.exit(1);
}

const env = { ...process.env, VITE_USE_EMULATORS: 'true' };

const hasJava = () => {
  try {
    execFileSync('java', ['-version'], { env, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

// Homebrew's openjdk is "keg-only": installed, but not on the PATH
if (!hasJava()) {
  const brewJava = ['/opt/homebrew/opt/openjdk@21/bin', '/opt/homebrew/opt/openjdk/bin', '/usr/local/opt/openjdk@21/bin']
    .find(dir => existsSync(`${dir}/java`));
  if (brewJava) env.PATH = `${brewJava}:${env.PATH}`;
}
if (!hasJava()) {
  console.error('De Firebase-emulators hebben Java 21 of nieuwer nodig. Installeer het met: brew install openjdk@21');
  process.exit(1);
}

const child = spawn('firebase', ['emulators:exec', '--only', 'auth,firestore', COMMANDS[mode]], {
  stdio: 'inherit',
  env: { ...env, PATH: `${process.cwd()}/node_modules/.bin:${env.PATH}` },
});
child.on('exit', code => process.exit(code ?? 1));
