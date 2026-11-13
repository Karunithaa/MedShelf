import * as SQLite from 'expo-sqlite';
import { getSampleMedicines } from '../data/sampleMedicines';

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
    CREATE TABLE IF NOT EXISTS family_profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, relationship TEXT NOT NULL DEFAULT 'Family',
      is_default INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS idx_profiles_owner ON family_profiles(user_id);
    CREATE TABLE IF NOT EXISTS notification_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      notification_id TEXT NOT NULL UNIQUE);
    CREATE TABLE IF NOT EXISTS medicines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      profile_id INTEGER REFERENCES family_profiles(id) ON DELETE CASCADE,
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
    ['profile_id', 'INTEGER REFERENCES family_profiles(id) ON DELETE CASCADE'],
  ]) {
    if (!existing.has(name)) await db.execAsync(`ALTER TABLE medicines ADD COLUMN ${name} ${definition}`);
  }
  // Move pre-upgrade medicine records into each account's default family profile.
  const users = await db.getAllAsync('SELECT id FROM users');
  for (const u of users) {
    let base = await db.getFirstAsync('SELECT id FROM family_profiles WHERE user_id=? AND is_default=1',u.id);
    if (!base) {
      const created = await db.runAsync('INSERT INTO family_profiles(user_id,name,relationship,is_default) VALUES(?,?,?,1)',u.id,'Me','Self');
      base={id:created.lastInsertRowId};
    }
    await db.runAsync('UPDATE medicines SET profile_id=? WHERE user_id=? AND profile_id IS NULL',base.id,u.id);
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
  const profile = await db.runAsync('INSERT INTO family_profiles(user_id,name,relationship,is_default) VALUES(?,?,?,1)', result.lastInsertRowId, 'Me', 'Self');
  // Seed only the designated demo account; never populate ordinary new users.
  // Existing accounts and medicines are not changed by this registration rule.
  if (username.trim().toLowerCase() === DEMO_USERNAME) {
    await seedUser(result.lastInsertRowId,profile.lastInsertRowId);
  }
  return getUser(result.lastInsertRowId);
}
export async function listMedicines(userId,profileId=null) {
  const db = await getDb();
  return profileId == null ? db.getAllAsync('SELECT * FROM medicines WHERE user_id = ? ORDER BY name COLLATE NOCASE', userId) : db.getAllAsync('SELECT * FROM medicines WHERE user_id = ? AND profile_id = ? ORDER BY name COLLATE NOCASE', userId, profileId);
}
export async function getMedicine(userId, id, profileId=null) {
  const db = await getDb();
  return db.getFirstAsync('SELECT * FROM medicines WHERE id = ? AND user_id = ?' + (profileId == null ? '' : ' AND profile_id = ?'), ...(profileId == null ? [id,userId] : [id,userId,profileId]));
}
const fields = ['name','category','form','strength_label','quantity','unit','expiry_date','storage_location','low_stock_threshold','notes','schedule_times','meal_relation','meal_offset_minutes','dose_quantity','image_uri'];
const values = m => fields.map(f => m[f] ?? (['strength_label','notes','schedule_times'].includes(f) ? '' : f === 'meal_relation' ? 'Not specified' : null));
export async function addMedicine(userId, medicine, profileId) {
  if (!profileId || !(await getProfile(userId, profileId))) throw new Error('Select a valid family member.');
  const db = await getDb();
  const r = await db.runAsync(`INSERT INTO medicines (user_id,profile_id,${fields.join(',')}) VALUES (${Array(fields.length + 2).fill('?').join(',')})`, userId, profileId, ...values(medicine));
  return r.lastInsertRowId;
}
export async function updateMedicine(userId, id, medicine, profileId) {
  const db = await getDb();
  const r = await db.runAsync(`UPDATE medicines SET ${fields.map(f => `${f}=?`).join(',')},updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND profile_id=?`, ...values(medicine), id, userId, profileId);
  return r.changes > 0;
}
export async function deleteMedicine(userId, id, profileId) {
  const db = await getDb();
  const r = await db.runAsync('DELETE FROM medicines WHERE id = ? AND user_id = ? AND profile_id=?', id, userId, profileId);
  return r.changes > 0;
}
export async function changeQuantity(userId, id, delta, profileId) {
  if (!Number.isSafeInteger(delta) || delta === 0) throw new Error('Enter a whole number above zero.');
  const db = await getDb();
  const r = await db.runAsync('UPDATE medicines SET quantity=quantity+?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=? AND profile_id=? AND quantity+? >= 0',delta,id,userId,profileId,delta);
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
export async function seedUser(userId,profileId) {
  const db = await getDb();
  const items = getSampleMedicines();
  // Exclusive transaction guarantees reset/seed cannot interleave with other database writes.
  await db.withExclusiveTransactionAsync(async tx => {
    for (const m of items) await tx.runAsync(
      `INSERT INTO medicines(user_id,profile_id,${fields.join(',')}) VALUES (${Array(fields.length+2).fill('?').join(',')})`, userId, profileId, ...values(m));
  });
}

export async function listProfiles(userId) {
  const db=await getDb();
  return db.getAllAsync('SELECT p.*, (SELECT COUNT(*) FROM medicines m WHERE m.profile_id=p.id AND m.user_id=p.user_id) AS medicine_count FROM family_profiles p WHERE p.user_id=? ORDER BY p.is_default DESC,p.id',userId);
}
export async function getProfile(userId,id) {
  const db=await getDb();
  return db.getFirstAsync('SELECT * FROM family_profiles WHERE user_id=? AND id=?',userId,id);
}
export async function addProfile(userId,name,relationship) {
  if (!name.trim() || name.trim().length>60) throw new Error('Enter a name (1–60 characters).');
  const db=await getDb();
  const r=await db.runAsync('INSERT INTO family_profiles(user_id,name,relationship) VALUES(?,?,?)',userId,name.trim(),relationship || 'Family');
  return r.lastInsertRowId;
}
export async function deleteProfile(userId,id) {
  const db=await getDb();
  const profile=await getProfile(userId,id);
  if (!profile || profile.is_default) throw new Error('The primary profile cannot be removed.');
  await db.runAsync('DELETE FROM family_profiles WHERE user_id=? AND id=? AND is_default=0',userId,id);
}
export async function getNotificationIds(userId) {
  const db=await getDb();return db.getAllAsync('SELECT notification_id FROM notification_jobs WHERE user_id=?',userId);
}
export async function replaceNotificationIds(userId,ids) {
  const db=await getDb();await db.withExclusiveTransactionAsync(async tx=>{
    await tx.runAsync('DELETE FROM notification_jobs WHERE user_id=?',userId);
    for(const id of ids)await tx.runAsync('INSERT INTO notification_jobs(user_id,notification_id) VALUES(?,?)',userId,id);
  });
}
