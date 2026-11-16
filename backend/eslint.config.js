/** ESLint flat config for CodeSense AI backend (CommonJS). */

import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Possible errors
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-process-exit': 'off',

      // Style
      'semi': ['error', 'always'],
      'indent': ['error', 2],
      'quotes': ['error', 'single'],
      'curly': ['error', 'all'],
      'eqeqeq': ['error', 'always'],
      'no-eq-null': 'error',
      'no-eval': 'error',
      'no-implicit-coercion': 'error',
      'no-lone-blocks': 'error',
      'no-multi-spaces': 'error',
      'no-tabs': 'error',
      'no-trailing-spaces': 'error',
      'object-curly-spacing': ['error', 'always'],
      'operator-linebreak': ['error', 'after'],
      'padded-blocks': ['error', 'never'],
      'space-before-blocks': 'error',
      'space-in-parens': ['error', 'never'],
      'space-unary-ops': 'error',
      'valid-typeof': 'error',

      // Prevent empty catch blocks and no-op callbacks
      'no-empty': ['error', { allowEmptyCatch: false }],
      'no-empty-function': 'warn',
      'no-constant-condition': 'warn',
    },
  },
  {
    ignores: ['node_modules/', 'package-lock.json'],
  },
];
