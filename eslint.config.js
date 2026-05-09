import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "docs/assets/**",
      "docs/index.html",
      "docs/404.html",
      "docs/sw.js",
      "node_modules/**",
      "tmp/**",
      "coverage/**",
      "playwright-report/**",
      "test-results/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}", "tests/**/*.ts", "vite.config.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.worker
      }
    },
    plugins: {
      "react-hooks": reactHooks
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error"
    }
  },
  {
    files: ["scripts/**/*.mjs", "eslint.config.js", "postcss.config.js", "tailwind.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        URL: "readonly"
      }
    }
  },
  {
    files: ["public/sw.js"],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        URL: "readonly"
      }
    }
  }
);
