import js from "@eslint/js"
import globals from "globals"
import tseslint from "typescript-eslint"

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ["packages/browser-extension/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions
      }
    }
  },
  {
    ignores: ["out", "dist", "node_modules", "electron.vite.config.*.mjs"]
  }
)
