const iterations = 210000;
const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
const bytes = value => Uint8Array.from(value.match(/.{2}/g) ?? [], pair => Number.parseInt(pair, 16));

/** Prototype credential hashing; the public mock API cannot enforce access control. */
export async function createPasswordDigest(password, salt = hex(crypto.getRandomValues(new Uint8Array(16)))) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const result = await crypto.subtle.deriveBits({name: 'PBKDF2', hash: 'SHA-256', salt: bytes(salt), iterations}, key, 256);
  return {algorithm: 'PBKDF2-SHA256', iterations, salt, digest: hex(new Uint8Array(result))};
}

export async function verifyPassword(password, stored) {
  if (stored?.algorithm !== 'PBKDF2-SHA256' || stored.iterations !== iterations
    || !/^[a-f0-9]{32}$/.test(stored.salt ?? '') || !/^[a-f0-9]{64}$/.test(stored.digest ?? '')) return false;
  const candidate = await createPasswordDigest(password, stored.salt);
  let difference = 0;
  for (let index = 0; index < stored.digest.length; index++) difference |= stored.digest.charCodeAt(index) ^ candidate.digest.charCodeAt(index);
  return difference === 0;
}
