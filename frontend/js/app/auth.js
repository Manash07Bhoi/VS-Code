/**
 * CodeSense AI — Auth state.
 *
 * Tracks the authenticated user. Single source of truth for client-side auth.
 */

let user = null;
const listeners = [];

function setUser(u) {
  user = u;
  listeners.forEach((fn) => { try { fn(user); } catch (e) { /* no-op */ } });
}

function getUser() {
  return user;
}

function isAuthenticated() {
  return !!user;
}

function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export const auth = { setUser, getUser, isAuthenticated, subscribe };
