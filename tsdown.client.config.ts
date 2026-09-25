import { defineConfig } from 'tsdown'

/**
 * Client 半区: 产物必须是浏览器脚本而不是普通 ESM, 顶层通过
 * window.__ModuleLoader__.load({ id, factory }) 注册, factory 内是 CJS 身体,
 * 平台模块一律经 factory 的 require 从模块表解析.
 */
export default defineConfig({
  name: 'dsh-deep-diving-back/client',
  entry: { client: 'src/client/index.ts' },
  outDir: 'lib',
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  dts: false,
  sourcemap: true,
  clean: false,
  deps: {
    // 模块表基线里的两行: react 与 react/jsx-runtime.
    neverBundle: ['react', 'react/jsx-runtime'],
    alwaysBundle: (specifier: string) => specifier !== 'react' && specifier !== 'react/jsx-runtime',
  },
  outputOptions: {
    entryFileNames: 'client.js',
    intro: 'var module = { exports: {} }; var exports = module.exports;',
    banner: 'window.__ModuleLoader__.load({ id: "dsh-deep-diving-back", factory: (require) => {',
    footer: 'return module.exports; } });',
  },
})
