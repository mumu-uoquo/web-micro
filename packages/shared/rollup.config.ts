import { defineConfig } from 'rollup'
import typescript from 'rollup-plugin-typescript2'
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
        useTsconfigDeclarationDir: true,
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
        useTsconfigDeclarationDir: true,
        // 第二次编译跳过声明文件生成（避免重复）
        tsconfigOverride: {
          compilerOptions: {
            declaration: false,
          },
        },
      }),
    ],
    external: ['axios', 'crypto-js', 'jsencrypt', 'vue-router'],
  },
])
