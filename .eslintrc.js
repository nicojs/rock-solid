module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [
      'packages/backend/tsconfig.src.json',
      'packages/backend/tsconfig.test.json',
      'packages/frontend/tsconfig.json',
      'packages/shared/tsconfig.json',
    ],
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'import'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  settings: {
    'import/resolver': {
      typescript: true,
      node: true,
    },
  },
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { ignoreRestSiblings: true },
    ],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: false,
        optionalDependencies: false,
        peerDependencies: true,
      },
    ],
  },
  overrides: [
    {
      files: [
        'packages/frontend/**/*.+(ts|cts|mts)',
        'packages/**/*.+(test|spec).+(ts|cts|mts)',
        'tasks/*.js',
      ],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
