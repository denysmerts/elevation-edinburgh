import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import importX, { createNodeResolver } from "eslint-plugin-import-x";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

// Feature modules may not import each other (see AGENTS.md).
const FEATURES = ["map", "search", "route-compare", "elevation-profile"];

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: { "import-x": importX },
    settings: {
      "import-x/resolver-next": [
        createNodeResolver({ extensions: [".ts", ".tsx", ".js", ".jsx", ".json"] }),
      ],
    },
    rules: {
      "import-x/no-restricted-paths": [
        "error",
        {
          zones: [
            // core is platform-agnostic: it may not reach outward
            {
              target: "./src/core",
              from: ["./src/app", "./src/adapters", "./src/features", "./src/components"],
              message:
                "src/core is platform-agnostic and may not import app/UI/adapter code.",
            },
            // features are isolated from each other
            ...FEATURES.map((feature) => ({
              target: `./src/features/${feature}`,
              from: "./src/features",
              except: [`./${feature}`],
              message:
                "Features may not import each other; go through core or app state.",
            })),
          ],
        },
      ],
    },
  },
  {
    // core purity: no React/MapLibre imports, no browser globals
    files: ["src/core/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "src/core must stay free of React." },
            { name: "react-dom", message: "src/core must stay free of React." },
            { name: "maplibre-gl", message: "src/core must stay free of map libraries." },
          ],
        },
      ],
      "no-restricted-globals": [
        "error",
        ...["window", "document", "navigator", "localStorage", "sessionStorage"].map(
          (name) => ({
            name,
            message: `src/core is platform-agnostic: access ${name} via src/adapters.`,
          }),
        ),
      ],
    },
  },
  prettier,
]);
