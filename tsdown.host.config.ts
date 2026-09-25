import { defineConfig } from 'tsdown'

/** Host 半区: 只提供 Loader 可激活的行与启动日志, 产物是普通 ESM. */
export default defineConfig({
  name: 'dsh-deep-diving-back',
  entry: ['src/index.ts'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  sourcemap: true,
  clean: false,
})
