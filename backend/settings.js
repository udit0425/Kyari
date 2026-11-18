// App settings stored in the SQLite `settings` table, so secrets like the Resend API key
// and admin password can be set from the admin UI instead of server env vars.
// Values are cached in memory; call loadSettings() once after initDb().

import { dbAll, dbRun } from './database.js';

const cache = new Map();

export const loadSettings = async () => {
  const rows = await dbAll('SELECT key, value FROM settings');
  cache.clear();
  rows.forEach((r) => cache.set(r.key, r.value));
};

export const getSetting = (key) => cache.get(key) ?? null;

export const setSetting = async (key, value) => {
  if (value === null || value === undefined || value === '') {
    await dbRun('DELETE FROM settings WHERE key = ?', [key]);
    cache.delete(key);
  } else {
    await dbRun('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [key, String(value)]);
    cache.set(key, String(value));
  }
};
