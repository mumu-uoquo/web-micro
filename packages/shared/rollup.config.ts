import { defineConfig } from 'rollup'
import typescript from '@rollup/plugin-typescript'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

export default defineConfig([
  // ESM 格式
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.esm.js', format: 'esm', sourcemap: true },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
      }),
    ],
    external: ['axios', 'crypto-js', 'jsencrypt', 'vue-router'],
  },
  // CJS 格式
  {
    input: 'src/index.ts',
    output: { file: 'dist/index.cjs.js', format: 'cjs', sourcemap: true },
    plugins: [
      resolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        declarationDir: undefined,
      }),
    ],
    external: ['axios', 'crypto-js', 'jsencrypt', 'vue-router'],
  },
])
