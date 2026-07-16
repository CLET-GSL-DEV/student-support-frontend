/** @type {import("prettier").Config} */
export default {
  singleQuote: true,
  bracketSpacing: true,
  trailingComma: 'all',
  jsxSingleQuote: false,
  proseWrap: 'always',
  useTabs: false,
  printWidth: 100,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  importOrder: ['^react(.*)', '<THIRD_PARTY_MODULES>', '^@starter/(.*)', '^@/(.*)', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
