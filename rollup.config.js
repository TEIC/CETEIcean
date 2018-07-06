import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  input: 'src/CETEI.js',
  output: {
    file: 'dist/CETEI.js',
    format: 'iife',
    name: 'CETEI',
    sourcemap: false,
  },
  plugins: [
    babel({exclude: 'node_modules/**', 
      "presets": [
        ["env", {
          "modules": false,
          "targets": {
            "chrome": 65,
            "safari": 11
          }
        }]
      ]}),
    uglify()
  ]
}
