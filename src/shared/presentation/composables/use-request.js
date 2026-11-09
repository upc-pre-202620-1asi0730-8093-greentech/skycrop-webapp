import {ref} from 'vue';

/** Serializes form actions and exposes translated status messages. */
export function useRequest() {
  const busy = ref(false), error = ref(''), success = ref('');
  async function run(action, successKey = '') {
    if (busy.value) return;
    busy.value = true; error.value = ''; success.value = '';
    try { const result = await action(); success.value = successKey; return result; }
    catch (failure) {
      error.value = /^(account|workspace|billing)\.[a-zA-Z]+$/.test(failure.message) ? failure.message : 'workspace.requestError';
    } finally { busy.value = false; }
  }
  return {busy, error, success, run};
}
