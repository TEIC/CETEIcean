import babel from "@rollup/plugin-babel";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "src/CETEI.ts",
  output: {
    file: "dist/CETEI.js",
    format: "iife",
    name: "CETEI",
    sourcemap: false,
  },
  plugins: [
    typescript({
      include: ["src/**/*.ts"],
      tsconfig: false,
      compilerOptions: {
        target: "ES2019",
        module: "ESNext",
        moduleResolution: "Node",
        lib: ["DOM", "DOM.Iterable", "ES2019"],
        allowJs: false,
        checkJs: false,
        strict: false,
        skipLibCheck: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        sourceMap: false
      }
    }),
    babel({exclude: "node_modules/**", 
      "babelHelpers": "bundled",
      "presets": [
        ["@babel/env", {
          "modules": false,
          "targets": {
            "chrome": 65,
            "safari": 13,
            "firefox": 60
          }
        }]
      ]}),
    terser()
  ]
}
