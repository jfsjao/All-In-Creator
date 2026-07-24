import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const envPath = resolve(root, '.env');
const firebasePath = resolve(root, 'src/environments/firebase.local.ts');

function parseEnv(contents) {
  const values = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }

  return values;
}

function hasUsableExistingConfig() {
  if (!existsSync(firebasePath)) return false;
  const contents = readFileSync(firebasePath, 'utf8');
  return !contents.includes('<YOUR_') && !contents.includes('YOUR_');
}

const fileValues = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
const values = { ...fileValues, ...process.env };
const required = [
  'FIREBASE_API_KEY',
  'FIREBASE_AUTH_DOMAIN',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_STORAGE_BUCKET',
  'FIREBASE_MESSAGING_SENDER_ID',
  'FIREBASE_APP_ID',
];
const missing = required.filter((key) => !values[key]?.trim());

if (missing.length) {
  if (hasUsableExistingConfig()) {
    console.log('Firebase: usando src/environments/firebase.local.ts existente.');
    process.exit(0);
  }

  const sourceHint = existsSync(envPath)
    ? 'Preencha as variáveis no .env'
    : 'Copie .env.example para .env e preencha os valores';
  console.error(`Variáveis obrigatórias ausentes no .env: ${missing.join(', ')}`);
  console.error(`${sourceHint} e execute novamente.`);
  process.exit(1);
}

const config = {
  apiKey: values.FIREBASE_API_KEY,
  authDomain: values.FIREBASE_AUTH_DOMAIN,
  ...(values.FIREBASE_DATABASE_URL ? { databaseURL: values.FIREBASE_DATABASE_URL } : {}),
  projectId: values.FIREBASE_PROJECT_ID,
  storageBucket: values.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: values.FIREBASE_MESSAGING_SENDER_ID,
  appId: values.FIREBASE_APP_ID,
};

const source = `// Gerado por scripts/configure-environment.mjs. Não versionar.
export const firebaseConfig = ${JSON.stringify(config, null, 2)};
`;

writeFileSync(firebasePath, source, { encoding: 'utf8', mode: 0o600 });
console.log('Firebase: src/environments/firebase.local.ts atualizado a partir do .env.');
