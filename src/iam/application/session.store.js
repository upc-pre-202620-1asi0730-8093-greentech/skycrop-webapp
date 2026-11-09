import {defineStore} from 'pinia';
import {ref} from 'vue';
import {CollectionApi} from '../../shared/infrastructure/collection-api.js';
import {EmailAddress} from '../domain/model/email-address.js';
import {createPasswordDigest, verifyPassword} from '../infrastructure/password-digest.js';

const api = new CollectionApi();
const storageKey = 'skycrop-demo-session';
const publicUser = user => ({id: user.id, name: user.name, email: user.email});

/** Mock identity session. No password, digest or challenge is stored in browser session data. */
export const useSessionStore = defineStore('session', () => {
  const user = ref(null), challenge = ref(null), expiresAt = ref(0);
  let pending = null;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    if (saved?.user?.id != null && saved.expiresAt > Date.now()) { user.value = publicUser(saved.user); expiresAt.value = saved.expiresAt; }
  } catch { /* Storage may be disabled. The in-memory session remains usable. */ }

  function setUser(resource) {
    user.value = resource ? publicUser(resource) : null;
    expiresAt.value = resource ? Date.now() + 8 * 60 * 60 * 1000 : 0;
    try {
      if (resource) sessionStorage.setItem(storageKey, JSON.stringify({user: user.value, expiresAt: expiresAt.value}));
      else sessionStorage.removeItem(storageKey);
    } catch { /* Private browsing can reject persistence. */ }
  }
  function logout() { setUser(null); pending = null; challenge.value = null; }

  function isSignedIn() {
    if (user.value && expiresAt.value <= Date.now()) logout();
    return Boolean(user.value);
  }

  async function register({name, email, password, acceptedTerms}) {
    email = new EmailAddress(email).value;
    if (!name.trim() || password.length < 8 || !acceptedTerms) throw new Error('account.invalidRegistration');
    if ((await api.list('users', {email})).some(item => item.email?.toLowerCase() === email)) throw new Error('account.duplicateEmail');
    const created = await api.create('users', {name: name.trim(), email, passwordDigest: await createPasswordDigest(password), createdAt: new Date().toISOString()});
    setUser(created);
  }

  function issueChallenge(kind, resource) {
    const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
    pending = {kind, resource, code, expiresAt: Date.now() + 300000, attempts: 0};
    // Demonstration codes are intentionally visible; no email delivery is claimed.
    challenge.value = {kind, code, expiresAt: pending.expiresAt};
  }

  async function login({email, password}) {
    email = new EmailAddress(email).value;
    const records = await api.list('users', {email});
    const record = records.find(item => item.email?.toLowerCase() === email);
    if (!record || !await verifyPassword(password, record.passwordDigest)) throw new Error('account.invalidCredentials');
    if (record.twoFactorEnabled) { issueChallenge('login', record); return false; }
    setUser(record);
    return true;
  }

  async function requestRecovery(email) {
    email = new EmailAddress(email).value;
    const record = (await api.list('users', {email})).find(item => item.email?.toLowerCase() === email);
    // The mock cannot deliver private recovery codes. Unknown accounts use the same visible flow.
    issueChallenge('recovery', record ?? null);
  }

  async function verifyChallenge(code, password) {
    if (!pending || pending.expiresAt <= Date.now() || pending.attempts >= 5) {
      pending = null; challenge.value = null; throw new Error('account.expiredCode');
    }
    pending.attempts++;
    if (String(code).trim() !== pending.code) throw new Error('account.invalidCode');
    if (pending.kind === 'recovery') {
      if (password.length < 8) throw new Error('account.invalidRegistration');
      if (pending.resource) await api.patch('users', pending.resource.id, {passwordDigest: await createPasswordDigest(password)});
    } else setUser(pending.resource);
    pending = null; challenge.value = null;
  }

  async function updateName(name) {
    const updated = await api.patch('users', user.value.id, {name: name.trim()});
    setUser(updated);
  }
  return {user, challenge, isSignedIn, register, login, logout, requestRecovery, verifyChallenge, updateName};
});
