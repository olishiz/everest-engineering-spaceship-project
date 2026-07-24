import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'] },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: { ...globals.node, ...globals.jest },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      // Nest exposes the adapter instance as `any`; Supertest accepts that runtime server value.
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
);
