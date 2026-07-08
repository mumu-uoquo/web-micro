import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const external = ['axios', 'crypto-js', 'jsencrypt', 'vue-router', '@fingerprintjs/fingerprintjs']

export default [
  // ESM 格式
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'src',
      }),
      resolve(),
      commonjs(),
    ],
    external,
  },
  // CJS 格式
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.cjs.js',
      format: 'cjs',
      sourcemap: true,
    },
    plugins: [
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        rootDir: 'src',
      }),
      resolve(),
      commonjs(),
    ],
    external,
  },
]
