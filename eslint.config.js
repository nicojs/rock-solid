// @ts-check
import pluginChaiFriendly from 'eslint-plugin-chai-friendly';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: [
          'packages/backend/tsconfig.src.json',
          'packages/backend/tsconfig.test.json',
          'packages/frontend/tsconfig.json',
          'packages/shared/tsconfig.json',
          './tsconfig.lint.json',
        ],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  {
    rules: {
      // Would be nice to have, but currently not enforced
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/require-await': 'off',

      // Don't care
      'no-undef': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
    },
  },
  {
    files: ['**/*.{mjs,cjs,js}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    files: ['**/*.{test,spec}.ts'],
    plugins: { 'chai-friendly': pluginChaiFriendly },
    rules: {
      '@typescript-eslint/no-unused-expressions': 'off',
      'chai-friendly/no-unused-expressions': 'error',
    },
  },
  {
    files: ['packages/frontend/**/*.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
  {
    ignores: [
      'packages/frontend/dist/',
      'packages/backend/dist/',
      'packages/shared/dist/',
    ],
  },
);
