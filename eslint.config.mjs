import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...nextVitals,
  ...nextTs,

  // TypeScript strict type-checking (mastering-typescript skill).
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "interface", format: ["PascalCase"] },
        { selector: "typeAlias", format: ["PascalCase"] },
      ],
      // Project rules from PLAN.md: no enums, no default exports outside Next.js files.
      "no-restricted-syntax": [
        "error",
        {
          selector: "TSEnumDeclaration",
          message: "Use a string literal union instead of an enum.",
        },
      ],

      // Icons are Font Awesome Pro Sharp via the `Icon` component; animation is Motion.
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "lucide-react",
              message:
                "Use the centralized Icon component (Font Awesome Sharp).",
            },
            {
              name: "material-symbols",
              message:
                "Use the centralized Icon component (Font Awesome Sharp).",
            },
            {
              name: "framer-motion",
              message: 'Import from "motion/react" instead.',
            },
          ],
          patterns: [
            {
              group: [
                "lucide-react/*",
                "material-symbols/*",
                "framer-motion/*",
              ],
              message: "Use Icon (Font Awesome Sharp) and motion/react.",
            },
          ],
        },
      ],
    },
  },

  // shadcn registry code is vendored; keep upstream diffs reviewable by not
  // reformatting it to satisfy the strictest type-aware rules.
  {
    files: ["src/components/ui/**"],
    rules: {
      "@typescript-eslint/array-type": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
    },
  },

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.config.{js,mjs,ts}",
    // Agent skills and editor config are not application code.
    ".agents/**",
    ".cursor/**",
  ]),
]);
