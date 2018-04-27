import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

export default {
  entry: 'src/CETEI.js',
  format: 'iife',
  dest: 'dist/CETEI.js',
  sourceMap: false,
  moduleName: 'CETEI',
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
      ]})//,
    //uglify()
  ]
}
