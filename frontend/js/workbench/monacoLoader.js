/**
 * CodeSense AI — Monaco loader for the workbench.
 *
 * Loads Monaco from the CDN exactly once, defines the CodeSense dark/light
 * editor themes, and exposes the monaco namespace. Worker setup uses a blob
 * URL proxy so cross-origin worker restrictions do not break tokenization.
 */

let monaco = null;
let loaderPromise = null;

const MONACO_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.52.0/min/vs';

function load() {
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise((resolve, reject) => {
    if (monaco) return resolve(monaco);

    // Worker cross-origin workaround: proxy worker through a blob URL.
    window.MonacoEnvironment = {
      getWorkerUrl: () => {
        const proxy = `
          self.MonacoEnvironment = { baseUrl: '${MONACO_CDN}' };
          importScripts('${MONACO_CDN}/base/worker/workerMain.js');
        `;
        const blob = new Blob([proxy], { type: 'text/javascript' });
        return URL.createObjectURL(blob);
      },
    };

    const script = document.createElement('script');
    script.src = `${MONACO_CDN}/loader.js`;
    script.onload = () => {
      window.require.config({ paths: { vs: MONACO_CDN } });
      window.require(['vs/editor/editor.main'], (monacoLib) => {
        monaco = monacoLib;
        defineThemes(monacoLib);
        resolve(monacoLib);
      }, (err) => {
        reject(new Error(`Monaco failed to load: ${err.message}`));
      });
    };
    script.onerror = () => reject(new Error('Monaco loader script failed to load (CDN unavailable).'));
    document.head.appendChild(script);
  });
  return loaderPromise;
}

function defineThemes(m) {
  // CodeSense dark — matches the app's dark surface tokens.
  m.editor.defineTheme('cs-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7a8295', fontStyle: 'italic' },
      { token: 'keyword', foreground: '9b7cff' },
      { token: 'string', foreground: '4ade80' },
      { token: 'number', foreground: 'fbbf24' },
      { token: 'type', foreground: '60a5fa' },
    ],
    colors: {
      'editor.background': '#0b0c10',
      'editor.foreground': '#e8eaed',
      'editorLineNumber.foreground': '#4a5262',
      'editorLineNumber.activeForeground': '#a6aebd',
      'editor.lineHighlightBackground': '#12141d',
      'editorCursor.foreground': '#9b7cff',
      'editor.selectionBackground': '#2a3040',
      'editorIndentGuide.background': '#1e2330',
      'editorGutter.background': '#0b0c10',
      'minimap.background': '#0d0f15',
    },
  });
  // CodeSense light — matches the app's light overrides.
  m.editor.defineTheme('cs-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8a93a5', fontStyle: 'italic' },
      { token: 'keyword', foreground: '5e42d9' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1f2430',
      'editor.lineHighlightBackground': '#f2f3f7',
      'editorCursor.foreground': '#5e42d9',
      'editor.selectionBackground': '#d9d2ff',
    },
  });
}

function get() {
  return monaco;
}

export { load, get };
