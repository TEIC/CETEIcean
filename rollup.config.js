import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/CETEI.js',
  output: {
    file: 'dist/CETEI.js',
    format: 'iife',
    name: 'CETEI',
    sourcemap: false,
  },
  external: [
    babel({exclude: 'node_modules/**', 
      "presets": [
        ["env", {
          "modules": false,
          "targets": {
            "chrome": 65,
            "safari": 11,
            "firefox": 60
          }
        }]
      ]}),
    terser()
  ]
}
