const tseslint = require("typescript-eslint");

module.exports = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      "no-debugger": "error",
      "no-eval": "error",
      "no-var": "error"
    }
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      ".angular/**",
      "**/*.spec.ts",
      "**/*.html",      // ← ajout : exclure tous les fichiers HTML
      "src/index.html",
      "src/assets/**"
    ]
  }
];
