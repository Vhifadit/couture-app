import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { files: ["**/*.{js,mjs,cjs}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.browser } },
]);
{
  "env"= {
    "node": true,
    "es2021": true
  },
  "extends"= [
    "eslint:recommended",
    "plugin:prettier/recommended"
  ],
  "plugins" = ["prettier"],
  "rules"= {
    "prettier/prettier": "error"
  }
}
