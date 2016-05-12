import babel from 'rollup-plugin-babel';

export default {
  entry: 'src/CETEI.js',
  format: 'iife',
  dest: 'dist/CETEI.js',
  sourceMap: true,
  moduleName: 'CETEI',
  plugins: [babel()]
}