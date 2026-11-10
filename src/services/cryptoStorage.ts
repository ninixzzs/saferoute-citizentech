const STORAGE_CRYPTO_SALT = 'SafeRoute-SP-CitizenTech-2026-AES-GCM';

async function deriveAesKey(): Promise<CryptoKey | null> {
  if (typeof window === 'undefined' || !window.crypto?.subtle) return null;
  try {
    const enc = new TextEncoder();
    const material = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(`${STORAGE_CRYPTO_SALT}:${window.location.origin}`),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode('saferoute-salt-v1'),
        iterations: 10000,
        hash: 'SHA-256',
      },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } catch {
    return null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

/**
 * Encrypts JSON payloads with AES-GCM-256 (Web Crypto API) for local persistence.
 */
export async function saveEncryptedStorage<T>(key: string, data: T): Promise<void> {
  if (typeof window === 'undefined') return;
  const serialized = JSON.stringify(data);
  try {
    const cryptoKey = await deriveAesKey();
    if (cryptoKey) {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encoded = new TextEncoder().encode(serialized);
      const cipherBuf = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        encoded
      );
      const payload = JSON.stringify({
        v: 1,
        alg: 'AES-GCM-256',
        iv: toBase64(iv),
        ct: toBase64(new Uint8Array(cipherBuf)),
      });
      localStorage.setItem(key, payload);
      return;
    }
  } catch {
    // Fallback below if SubtleCrypto is unavailable in insecure origin
  }
  localStorage.setItem(key, serialized);
}

/**
 * Decrypts AES-GCM-256 stored records (supports transparent migration from legacy plaintext JSON).
 */
export async function loadEncryptedStorage<T>(key: string): Promise<T | null> {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed && parsed.v === 1 && parsed.alg === 'AES-GCM-256' && parsed.iv && parsed.ct) {
      const cryptoKey = await deriveAesKey();
      if (!cryptoKey) return null;
      const iv = new Uint8Array(fromBase64(parsed.iv));
      const ct = new Uint8Array(fromBase64(parsed.ct));
      const plainBuf = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        cryptoKey,
        ct
      );
      const decoded = new TextDecoder().decode(plainBuf);
      return JSON.parse(decoded) as T;
    }
    return parsed as T;
  } catch {
    return null;
  }
}
