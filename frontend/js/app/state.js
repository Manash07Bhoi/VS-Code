/**
 * CodeSense AI — Application state.
 */

const state = {
  language: 'javascript',
  languages: [],
  source: '',
  editorReady: false,
  submitting: false,
  review: null,
  reviews: [],
  historyPage: 1,
  historyTotal: 0,
  historyLimit: 20,
  loading: false,
  error: null,
  providerUnavailable: false,
  unsavedChanges: false,
};

const listeners = [];

function set(patch) {
  Object.assign(state, patch);
  listeners.forEach((fn) => { try { fn(state); } catch (e) { /* no-op */ } });
}

function get() {
  return state;
}

function subscribe(fn) {
  listeners.push(fn);
  return () => {
    const i = listeners.indexOf(fn);
    if (i >= 0) listeners.splice(i, 1);
  };
}

export { state, set, get, subscribe };
