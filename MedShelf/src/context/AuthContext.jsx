import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initializeDb, findUser, createUser, getUser } from '../database/db';
import { hashPassword, checkPassword } from '../utils/password';
const SESSION_KEY = 'medshelf_user_id';
const Context = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    (async () => {
      try {
        await initializeDb();
        const id = await SecureStore.getItemAsync(SESSION_KEY);
        if (id && /^\d+$/.test(id)) {
          const existing = await getUser(Number(id));
          if (existing) setUser(existing);
          else await SecureStore.deleteItemAsync(SESSION_KEY);
        }
      } catch (err) { console.warn('Database startup problem:', err); }
      finally { setReady(true); }
    })();
  }, []);
  async function register(username, password) {
    const clean = username.trim();
    if (clean.length < 3 || clean.length > 30) throw new Error('Username must be 3–30 characters.');
    if (!/^[\w.-]+$/.test(clean)) throw new Error('Use letters, numbers, dots, dashes or underscores in username.');
    if (password.length < 8) throw new Error('Password must contain at least 8 characters.');
    if (await findUser(clean)) throw new Error('Username is already registered on this device.');
    const passwordHash = await hashPassword(password);
    try { await createUser(clean, passwordHash); }
    catch (e) {
      if (String(e).includes('UNIQUE')) throw new Error('Username is already registered on this device.');
      throw e;
    }
  }
  async function login(username, password) {
    const account = await findUser(username);
    if (!account || !(await checkPassword(password, account.password_hash))) throw new Error('Invalid username or password.');
    await SecureStore.setItemAsync(SESSION_KEY, String(account.id));
    setUser({id:account.id,username:account.username});
  }
  async function logout() {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    setUser(null);
  }
  return <Context.Provider value={{user,ready,register,login,logout}}>{children}</Context.Provider>;
}
export const useAuth = () => useContext(Context);
