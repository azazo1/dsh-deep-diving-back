/**
 * 状态文案的省略号规则: 与 0.1.6 一致地以省略号结尾, 但已经带省略号的串
 * (例如英文串) 原样保留, 不重复追加. 断言用占位串, 不依赖具体文案.
 */
import { describe, expect, it } from 'vitest'
import { deepDivingLabel } from '../src/client/status-label.ts'

describe('deep diving label', () => {
  it('appends the ellipsis the later dictionary dropped', () => {
    expect(deepDivingLabel('alpha')).toBe('alpha...')
  })

  it('keeps a label that already ends with an ellipsis', () => {
    expect(deepDivingLabel('alpha...')).toBe('alpha...')
    expect(deepDivingLabel('alpha…')).toBe('alpha…')
  })

  it('trims trailing whitespace before appending', () => {
    expect(deepDivingLabel('alpha  ')).toBe('alpha...')
    expect(deepDivingLabel('alpha... ')).toBe('alpha... ')
  })
})
