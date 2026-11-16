/**
 * CodeSense AI — Monaco Editor integration.
 *
 * Loads Monaco from CDN, initializes the editor, manages language modes,
 * source revisions, and disposal. Exposes a small imperative API.
 */

import { state, set, get } from './state.js';

let monaco = null;
let editor = null;
let loaderPromise = null;
let container = null;
let onChangeCallback = null;

const MONACO_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs';
const MONACO_PATHS = { vs: MONACO_CDN };

function loadMonaco() {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    window.MonacoEnvironment = {
      getWorkerUrl: (moduleId, label) => {
        return `${MONACO_CDN}/../monaco-editor.min.js`;
      },
    };
    const script = document.createElement('script');
    script.src = `${MONACO_CDN}/loader.js`;
    script.onload = () => {
      window.require.config({ paths: MONACO_PATHS });
      window.require(['vs/editor/editor.main'], (monacoLib) => {
        monaco = monacoLib;
        resolve(monaco);
      }, (err) => {
        reject(new Error(`Monaco failed to load: ${err.message}`));
      });
    };
    script.onerror = () => reject(new Error('Monaco loader script failed to load.'));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

function isLoaded() {
  return !!monaco;
}

async function init(containerEl, options = {}) {
  if (!monaco) await loadMonaco();
  container = containerEl;

  const defaultOptions = {
    value: options.value || '',
    language: options.language || 'javascript',
    theme: options.theme || 'vs-dark',
    automaticLayout: true,
    lineNumbers: 'on',
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    wordWrap: 'on',
    fontSize: 14,
    fontFamily: '"Fira Mono", "Consolas", "Monaco", monospace',
    selectOnLineNumbers: true,
  };

  editor = monaco.editor.create(container, defaultOptions);

  editor.onDidChangeModelContent(() => {
    const value = editor.getValue();
    set({ source: value, unsavedChanges: true });
    if (onChangeCallback) onChangeCallback(value);
  });

  set({ editorReady: true });
  return editor;
}

function getValue() {
  return editor ? editor.getValue() : '';
}

function setValue(value) {
  if (editor) {
    editor.setValue(value || '');
    set({ source: value || '', unsavedChanges: false });
  } else {
    set({ source: value || '' });
  }
}

function setLanguage(languageId) {
  if (!editor || !monaco) return;
  try {
    monaco.editor.setModelLanguage(editor.getModel(), languageId);
    set({ language: languageId });
  } catch (e) {
    console.warn('codesense-monaco.language-set-failed', e.message);
  }
}

function getLanguage() {
  return get().language;
}

function focus() {
  if (editor) editor.focus();
}

function getSelectionRange() {
  if (!editor) return null;
  const sel = editor.getSelection();
  return sel ? { startLine: sel.startLineNumber, startCol: sel.startColumn, endLine: sel.endLineNumber, endCol: sel.endColumn } : null;
}

function setSelectionRange(range) {
  if (!editor) return;
  editor.setSelection({
    startLineNumber: range.startLine,
    startColumn: range.startCol || 1,
    endLineNumber: range.endLine || 1,
    endColumn: range.endCol || 1,
  });
  editor.revealRangeInCenter(editor.getSelection());
}

function highlightRange(range) {
  if (!editor || !range) return null;
  const ids = editor.deltaDecorations([], [{
    range: new monaco.Range(range.startLine, 1, range.endLine, 1000),
    options: {
      className: 'monaco-finding-highlight',
      inlineClassName: 'monaco-finding-inline',
      isWholeLine: false,
    },
  }]);
  return ids;
}

function clearDecorations(decorationIds) {
  if (!editor) return;
  editor.deltaDecorations(decorationIds || [], []);
}

function dispose() {
  if (editor) {
    editor.dispose();
    editor = null;
  }
  monaco = null;
  container = null;
  loaderPromise = null;
  set({ editorReady: false });
}

function onChange(callback) {
  onChangeCallback = callback;
}

export { loadMonaco, isLoaded, init, getValue, setValue, setLanguage, getLanguage, focus, getSelectionRange, setSelectionRange, highlightRange, clearDecorations, dispose, onChange };
