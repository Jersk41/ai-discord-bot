import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import json from "eslint-plugin-json";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {files: ["**/*.{js,mjs,cjs,ts}"]},
  {files: ["**/*.js"], languageOptions: {sourceType: "commonjs"}},
  {files: ["**/*.json"], ...json.configs['recommended']},
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
