import * as SQLite from 'expo-sqlite';
import { getSampleMedicines } from '../data/sampleMedicines';

// Register this username to create a dedicated offline ICA demonstration account.
// All other newly registered users start with an empty medicine inventory.
export const DEMO_USERNAME = 'medshelf_demo';

let databasePromise;
export const getDb = () => {
  if (!databasePromise) databasePromise = SQLite.openDatabaseAsync('medshelf.db');
  return databasePromise;
};
export async function initializeDb() {
  const db = await getDb();
  await db.execAsync(`PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL COLLATE NOCASE UNIQUE,
      password_hash TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS preferences (
      user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      warning_days INTEGER NOT NULL DEFAULT 30, default_threshold INTEGER NOT NULL DEFAULT 5);
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, category TEXT NOT NULL, form TEXT NOT NULL,
      strength_label TEXT NOT NULL DEFAULT '', quantity INTEGER NOT NULL CHECK(quantity >= 0),
      unit TEXT NOT NULL, expiry_date TEXT NOT NULL, storage_location TEXT NOT NULL,
      low_stock_threshold INTEGER NOT NULL CHECK(low_stock_threshold >= 0),
      notes TEXT NOT NULL DEFAULT '', schedule_times TEXT NOT NULL DEFAULT '', meal_relation TEXT NOT NULL DEFAULT 'Not specified', meal_offset_minutes INTEGER, dose_quantity INTEGER, image_uri TEXT, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE INDEX IF NOT EXISTS idx_medicines_owner ON medicines(user_id);
    CREATE INDEX IF NOT EXISTS idx_medicines_expiry ON medicines(user_id, expiry_date);`);
  // Migrate existing installations without deleting accounts or inventory.
  const columns = await db.getAllAsync('PRAGMA table_info(medicines)');
  const existing = new Set(columns.map(c => c.name));
  for (const [name, definition] of [
    ['schedule_times', "TEXT NOT NULL DEFAULT ''"],
    ['meal_relation', "TEXT NOT NULL DEFAULT 'Not specified'"],
    ['meal_offset_minutes', 'INTEGER'],
    ['dose_quantity', 'INTEGER'],
    ['image_uri', 'TEXT'],
  ]) {
    if (!existing.has(name)) await db.execAsync(`ALTER TABLE medicines ADD COLUMN ${name} ${definition}`);
  }
  return db;
}
export async function findUser(username) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM users WHERE username = ? COLLATE NOCASE', username.trim());
}
export async function getUser(id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT id, username FROM users WHERE id = ?', id);
}
export async function createUser(username, passwordHash) {
  const db = await getDb();
  const result = await db.runAsync('INSERT INTO users (username,password_hash) VALUES (?,?)', username.trim(), passwordHash);
  await db.runAsync('INSERT INTO preferences (user_id) VALUES (?)', result.lastInsertRowId);
  // Seed only the designated demo account; never populate ordinary new users.
  // Existing accounts and medicines are not changed by this registration rule.
  if (username.trim().toLowerCase() === DEMO_USERNAME) {
    await seedUser(result.lastInsertRowId);
  }
  return getUser(result.lastInsertRowId);
}
export async function listMedicines(userId) {
  const db = await getDb();
  return db.getAllAsync('SELECT * FROM medicines WHERE user_id = ? ORDER BY name COLLATE NOCASE', userId);
}
export async function getMedicine(userId, id) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM medicines WHERE id = ? AND user_id = ?', id, userId);
}
const fields = ['name','category','form','strength_label','quantity','unit','expiry_date','storage_location','low_stock_threshold','notes','schedule_times','meal_relation','meal_offset_minutes','dose_quantity','image_uri'];
const values = m => fields.map(f => m[f] ?? (['strength_label','notes','schedule_times'].includes(f) ? '' : f === 'meal_relation' ? 'Not specified' : null));
export async function addMedicine(userId, medicine) {
  const db = await getDb();
  const r = await db.runAsync(`INSERT INTO medicines (user_id,${fields.join(',')}) VALUES (${Array(fields.length + 1).fill('?').join(',')})`, userId, ...values(medicine));
  return r.lastInsertRowId;
}
export async function updateMedicine(userId, id, medicine) {
  const db = await getDb();
  const r = await db.runAsync(`UPDATE medicines SET ${fields.map(f => `${f}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`, ...values(medicine), id, userId);
  return r.changes > 0;
}
export async function deleteMedicine(userId, id) {
  const db = await getDb();
  const r = await db.runAsync('DELETE FROM medicines WHERE id = ? AND user_id = ?', id, userId);
  return r.changes > 0;
}
export async function changeQuantity(userId, id, delta) {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new Error('Enter a whole number above zero.');
  const db = await getDb();
  const r = await db.runAsync('UPDATE medicines SET quantity=quantity+?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND quantity+? >= 0',delta,id,userId,delta);
  if (r.changes !== 1) throw new Error('Not enough stock, or medicine no longer exists.');
}
export async function getPreferences(userId) {
  const db = await getDb();
  return (await db.getFirstAsync('SELECT * FROM preferences WHERE user_id=?',userId)) || {warning_days:30,default_threshold:5};
}
export async function savePreferences(userId, warningDays, defaultThreshold) {
  const db = await getDb();
  await db.runAsync(`INSERT INTO preferences(user_id,warning_days,default_threshold) VALUES(?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET warning_days=excluded.warning_days, default_threshold=excluded.default_threshold`, userId, warningDays, defaultThreshold);
}
export async function seedUser(userId) {
  const db = await getDb();
  const items = getSampleMedicines();
  // Exclusive transaction guarantees reset/seed cannot interleave with other database writes.
  await db.withExclusiveTransactionAsync(async tx => {
    for (const m of items) await tx.runAsync(
      `INSERT INTO medicines(user_id,${fields.join(',')}) VALUES (${Array(fields.length+1).fill('?').join(',')})`, userId, ...values(m));
  });
}
export async function resetSampleData(userId) {
  const db = await getDb();
  const items = getSampleMedicines();
  await db.withExclusiveTransactionAsync(async tx => {
    await tx.runAsync('DELETE FROM medicines WHERE user_id=?', userId);
    for (const m of items) await tx.runAsync(
      `INSERT INTO medicines(user_id,${fields.join(',')}) VALUES (${Array(fields.length+1).fill('?').join(',')})`, userId, ...values(m));
  });
}
