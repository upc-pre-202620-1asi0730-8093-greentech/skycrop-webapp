/** Only local application paths may be used as post-login destinations. */
export function safeReturnPath(value) {
  return typeof value === 'string' && /^\/(?!\/|\\)/.test(value)
    && !/[\\\r\n]/.test(value) && !/^\/(login|register|recover-access|verify-access)(\/|\?|$)/.test(value)
    ? value : '/home';
}

/** Route guards describe prototype navigation, never server authorization. */
export function sessionRedirect(to, signedIn) {
  if (!to.meta.public && !signedIn) return {name: 'login', query: {redirect: to.fullPath}};
  if (to.meta.guestOnly && signedIn) return safeReturnPath(to.query.redirect);
  return true;
}
