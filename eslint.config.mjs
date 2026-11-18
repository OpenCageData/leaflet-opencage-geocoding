import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import js from '@eslint/js';

export default defineConfig([
  // Build output and generated reports. Must stay in a config object of its
  // own: an `ignores` key next to other keys only scopes that one object.
  globalIgnores(['dist/', 'coverage/']),

  {
    extends: [js.configs.recommended],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        L: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },

      ecmaVersion: 2021,
      sourceType: 'module',
    },

    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
    },
  },
]);
