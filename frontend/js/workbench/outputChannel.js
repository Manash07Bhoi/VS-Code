/**
 * CodeSense AI — Workbench output channel.
 *
 * A tiny append-only log used by the Output panel. Only real events are
 * logged (navigation, saves, API calls, provider results) — never fabricated
 * output.
 */

const channels = new Map(); // name -> [{ time, message }]
let activeChannel = 'workbench';
const listeners = new Set();

const MAX_LINES = 400;

function append(channel, message) {
  if (!channels.has(channel)) channels.set(channel, []);
  const log = channels.get(channel);
  log.push({ time: new Date(), message: String(message) });
  if (log.length > MAX_LINES) log.splice(0, log.length - MAX_LINES);
  emitChanged(channel);
}

function log(channel, message) {
  append(channel, message);
}

function getLines(channel) {
  return (channels.get(channel) || []).slice();
}

function listChannels() {
  return Array.from(channels.keys()).sort();
}

function setActive(channel) {
  activeChannel = channel;
  emitChanged(channel);
}

function getActive() {
  return activeChannel;
}

function clear(channel) {
  channels.set(channel, []);
  emitChanged(channel);
}

function emitChanged(channel) {
  listeners.forEach((fn) => { try { fn(channel); } catch (_e) { /* isolated */ } });
}

function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export { log, append, getLines, listChannels, setActive, getActive, clear, onChange };
