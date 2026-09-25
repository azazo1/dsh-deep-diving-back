/**
 * 计时语义: 阈值来自旧版 (运行满 15 秒才出现), 格式化分段与补零也照抄旧版.
 * 断言模板键与参数, 不断言具体文案.
 */
import { describe, expect, it } from 'vitest'
import {
  CLOCK_VISIBLE_AFTER_MS, clockVisible, formatRunDuration, type RunDurationTranslate,
} from '../src/client/run-clock.ts'

interface Recorded {
  readonly key: string
  readonly params: Record<string, unknown> | undefined
}

function recorder(): { readonly t: RunDurationTranslate, readonly calls: Recorded[] } {
  const calls: Recorded[] = []
  const t = ((key: string, params?: Record<string, unknown>) => {
    calls.push({ key, params })
    return key
  }) as RunDurationTranslate
  return { t, calls }
}

describe('run clock', () => {
  it('reveals the clock exactly at the 15 second threshold', () => {
    expect(CLOCK_VISIBLE_AFTER_MS).toBe(15_000)
    expect(clockVisible(14_999)).toBe(false)
    expect(clockVisible(15_000)).toBe(true)
  })

  it('formats seconds, padded minutes and padded hours', () => {
    const seconds = recorder()
    expect(formatRunDuration(5_000, seconds.t)).toBe('duration.seconds')
    expect(seconds.calls[0]?.params).toEqual({ seconds: 5 })

    const minutes = recorder()
    expect(formatRunDuration(61_000, minutes.t)).toBe('duration.minutes')
    expect(minutes.calls[0]?.params).toEqual({ minutes: 1, seconds: '01' })

    const hours = recorder()
    expect(formatRunDuration(3_661_000, hours.t)).toBe('duration.hours')
    expect(hours.calls[0]?.params).toEqual({ hours: 1, minutes: '01', seconds: '01' })
  })

  it('clamps negative elapsed time to zero', () => {
    const { t, calls } = recorder()
    formatRunDuration(-1_000, t)
    expect(calls[0]?.params).toEqual({ seconds: 0 })
  })
})
