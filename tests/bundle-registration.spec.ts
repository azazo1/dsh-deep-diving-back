/**
 * 产物级校验: 直接执行构建后的 client bundle, 证明它按 DSH 的 Client module
 * loader 契约注册了自己, 并且运行期只向模块表请求平台模块.
 * 断言全部用稳定标识 (包名, 槽位名, 服务名), 不断言界面文案.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createContext, runInContext } from 'node:vm'
import { describe, expect, it } from 'vitest'
import { PACKAGE_NAME } from '../src/naming.ts'

const BUNDLE_PATH = fileURLToPath(new URL('../lib/client.js', import.meta.url))

/** 模块表基线里本插件会用到的那几行. */
const PLATFORM_MODULES = new Set(['react', 'react/jsx-runtime'])

interface Registration {
  readonly id: string
  readonly factory: (require: (specifier: string) => unknown) => unknown
}

interface LoadedBundle {
  readonly code: string
  /** bundle 顶层注册的 id. */
  readonly id: string
  readonly requested: readonly string[]
  readonly exported: { readonly apply?: unknown, readonly inject?: readonly string[] }
}

const reactStub = {
  memo: (component: unknown) => component,
  useEffect: () => {},
  useState: (initial: unknown) => [typeof initial === 'function' ? (initial as () => unknown)() : initial, () => {}],
}

const jsxRuntimeStub = { jsx: () => null, jsxs: () => null, Fragment: 'Fragment' }

/** 在一个假 window 里执行 bundle, 取出注册项与 factory 的导出. */
function loadBundle(code: string): LoadedBundle {
  let registration: Registration | undefined
  runInContext(code, createContext({
    console,
    window: { __ModuleLoader__: { load: (value: Registration) => { registration = value } } },
  }))
  if (registration === undefined) throw new Error('bundle did not call window.__ModuleLoader__.load')
  const requested: string[] = []
  const exported = registration.factory((specifier: string) => {
    requested.push(specifier)
    if (specifier === 'react') return reactStub
    if (specifier === 'react/jsx-runtime') return jsxRuntimeStub
    throw new Error(`client bundle requested a module outside the table: ${specifier}`)
  }) as LoadedBundle['exported']
  return { code, id: registration.id, requested, exported }
}

describe('client bundle registration', () => {
  it('registers the package id and exposes a plugin the loader can mount', async () => {
    const loaded = loadBundle(await readFile(BUNDLE_PATH, 'utf8'))
    expect(loaded.id).toBe(PACKAGE_NAME)
    expect(typeof loaded.exported.apply).toBe('function')
    expect(loaded.exported.inject).toContain('slots')
    expect(loaded.exported.inject).toContain('uiConversation')
  })

  it('requests only platform modules and carries no top-level ESM syntax', async () => {
    const loaded = loadBundle(await readFile(BUNDLE_PATH, 'utf8'))
    expect(loaded.requested.length).toBeGreaterThan(0)
    for (const specifier of loaded.requested) expect(PLATFORM_MODULES.has(specifier)).toBe(true)
    expect(loaded.code).not.toMatch(/^\s*(?:import|export)[\s{]/m)
  })
})
