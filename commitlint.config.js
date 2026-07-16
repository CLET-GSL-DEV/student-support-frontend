/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Allow the package/app names as scopes, plus a few cross-cutting ones.
    'scope-enum': [
      1,
      'always',
      [
        'root',
        'ui',
        'auth',
        'api-client',
        'utils',
        'types',
        'hooks',
        'config',
        'admin-portal',
        'public-portal',
        'ci',
        'deps',
        'release',
      ],
    ],
  },
};
