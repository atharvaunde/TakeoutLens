import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // E1: UI code must not reach into server-only modules; data comes via props or Server Functions.
    files: ["components/**/*.{ts,tsx}", "stores/**/*.{ts,tsx}", "hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(@/|(\\.\\./)+)server/(?!actions/)",
              message: "UI code may only import Server Functions from server/actions (plan E1).",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Downloaded Claude Design project: reference only, not our code.
    "design/**",
  ]),
]);

export default eslintConfig;
