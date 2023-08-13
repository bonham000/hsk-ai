/** @type {import("prettier").Config} */
const config = {
  plugins: [
    require.resolve("prettier-plugin-tailwindcss"),
    "@trivago/prettier-plugin-sort-imports"
  ],
};

module.exports = config;
