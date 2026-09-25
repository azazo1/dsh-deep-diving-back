/**
 * 运行计时. 语义与 0.1.6 的 `formatRunDuration` 完全一致: 不足一分钟只给秒,
 * 满一分钟给分加补零两位的秒, 满一小时给时加分秒且都补零.
 * 阈值同样照抄旧版: 运行满 15 秒才把计时画出来.
 */
import type { Translate } from '@deepseek-ai/dsh-client-ui-slots'

/** 计时模板来自 chat 命名空间. */
export type RunDurationTranslate = Translate<'duration.seconds' | 'duration.minutes' | 'duration.hours'>

/** 计时出现阈值, 与 0.1.6 的 TurnStatus 一致. */
export const CLOCK_VISIBLE_AFTER_MS = 15_000

/** 时钟刷新间隔. */
export const CLOCK_INTERVAL_MS = 1_000

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * 本地化的已运行时长.
 * @param ms - 已运行毫秒数, 负数按零处理.
 * @param t - chat 命名空间的翻译位.
 * @returns 不足一分钟为秒, 满一分钟为分加两位秒, 满一小时为时加两位分秒.
 */
export function formatRunDuration(ms: number, t: RunDurationTranslate): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor(total / 60) % 60
  const seconds = total % 60
  if (hours > 0) {
    return t('duration.hours', { hours, minutes: pad2(minutes), seconds: pad2(seconds) })
  }
  return minutes > 0
    ? t('duration.minutes', { minutes, seconds: pad2(seconds) })
    : t('duration.seconds', { seconds })
}

/**
 * 计时是否已经该出现.
 * @param elapsedMs - 已运行毫秒数.
 * @returns 是否达到阈值.
 */
export function clockVisible(elapsedMs: number): boolean {
  return elapsedMs >= CLOCK_VISIBLE_AFTER_MS
}
