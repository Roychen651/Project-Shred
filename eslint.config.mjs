import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // A frozen, verbatim copy of the artifact being ported. It is documentation
    // of what the app does today, not code this repo maintains — linting it would
    // only ever produce noise, and editing it to satisfy a rule would destroy its
    // value as the reference for the port.
    "reference/**",
  ]),
]);

export default eslintConfig;
