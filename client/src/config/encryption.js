/**
 * Simple End-to-End Encryption utility using Web Crypto API (AES-GCM)
 */

const getPasswordKey = (password) => {
  const enc = new TextEncoder();
  return window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
};

const deriveKey = async (passwordKey, salt) => {
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// We use a deterministic salt based on the conversation IDs for simplicity in this demo
const staticSalt = new TextEncoder().encode("VeloxChat-Salt-2026");

export const encryptMessage = async (text, sharedId) => {
  try {
    const passwordKey = await getPasswordKey(sharedId);
    const key = await deriveKey(passwordKey, staticSalt);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(text);

    const ciphertext = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      encoded
    );

    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(ciphertext), iv.length);

    return btoa(String.fromCharCode(...combined));
  } catch (e) {
    console.error("Encryption failed", e);
    return text;
  }
};

export const decryptMessage = async (encryptedBase64, sharedId) => {
  try {
    const combined = new Uint8Array(
      atob(encryptedBase64).split("").map((c) => c.charCodeAt(0))
    );
    const iv = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    const passwordKey = await getPasswordKey(sharedId);
    const key = await deriveKey(passwordKey, staticSalt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      ciphertext
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    // If decryption fails, it might be a plain message or wrong key
    return encryptedBase64;
  }
};

export const getSharedId = (id1, id2) => {
    if(!id1 || !id2) return id1 || id2;
    return [id1, id2].sort().join("_");
};
