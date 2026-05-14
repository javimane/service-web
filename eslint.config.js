import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  globalIgnores(["dist", ".next", "node_modules"]),
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    extends: [js.configs.recommended, reactHooks.configs.flat.recommended],
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "off",
      "no-empty": "off",
      "no-async-promise-executor": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/static-components": "off",
    },
  },
]);
