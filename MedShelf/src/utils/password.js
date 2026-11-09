import * as Crypto from 'expo-crypto';
import { pbkdf2Async } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils';

const ITERATIONS = 120000;
export async function hashPassword(password) {
  const salt = Crypto.getRandomBytes(16);
  const derived = await pbkdf2Async(sha256, utf8ToBytes(password), salt, { c: ITERATIONS, dkLen: 32 });
  return `pbkdf2-sha256$${ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(derived)}`;
}
export async function checkPassword(password, encoded) {
  try {
    const [algorithm, iterations, saltHex, digestHex] = encoded.split('$');
    const count = Number(iterations);
    if (algorithm !== 'pbkdf2-sha256' || !Number.isInteger(count) || count < 100000 || count > 1000000) return false;
    const actual = await pbkdf2Async(sha256, utf8ToBytes(password), hexToBytes(saltHex), { c: count, dkLen: 32 });
    const expected = hexToBytes(digestHex);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch { return false; }
}
