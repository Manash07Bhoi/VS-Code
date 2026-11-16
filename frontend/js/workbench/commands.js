/**
 * CodeSense AI — Workbench command registry.
 *
 * Every workbench action is registered as a command with an id, title,
 * category, optional keybinding and run() function. The command palette
 * lists exactly these commands — no dead entries.
 */

const commands = new Map();
const listeners = new Set();

function register(id, title, run, opts = {}) {
  if (commands.has(id)) {
    // Re-registration replaces the handler (used for re-binding).
  }
  commands.set(id, {
    id,
    title,
    category: opts.category || '',
    keybinding: opts.keybinding || '',
    when: opts.when || null, // optional predicate: command hidden when false
    run,
  });
  emitChanged();
  return commands.get(id);
}

function unregister(id) {
  const had = commands.delete(id);
  if (had) emitChanged();
}

function get(id) {
  return commands.get(id) || null;
}

function list() {
  return Array.from(commands.values())
    .filter((c) => !c.when || safeWhen(c))
    .sort((a, b) => (a.category + a.title).localeCompare(b.category + b.title));
}

function safeWhen(c) {
  try { return !!c.when(); } catch (_e) { return false; }
}

function execute(id, ...args) {
  const cmd = commands.get(id);
  if (!cmd) return false;
  if (cmd.when && !safeWhen(cmd)) return false;
  try {
    cmd.run(...args);
    return true;
  } catch (err) {
    console.error(`[workbench] command "${id}" failed:`, err);
    return false;
  }
}

function emitChanged() {
  listeners.forEach((fn) => { try { fn(); } catch (_e) { /* isolated */ } });
}

function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export { register, unregister, get, list, execute, onChange };
