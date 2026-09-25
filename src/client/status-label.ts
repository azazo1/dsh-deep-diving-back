/**
 * 还原 0.1.6 的状态文案.
 *
 * `1bcb633c3f` (0.1.7-alpha.1) 连同蓝色流光一起把中文串的省略号去掉了
 * (旧: `深度求索中...`, 新: `深度求索中`), 英文串两个版本都带省略号.
 * 这里只在缺失时补回, 不去改动 chat 命名空间的字典.
 */

/** 已经以省略号 (半角三点或单字符省略号) 结尾. */
const TRAILING_ELLIPSIS = /(?:\.{3}|…)$/

/**
 * 让状态文案与 0.1.6 一致地以省略号结尾.
 * @param label - 当前 locale 的 `chat.deepDiving` 文案.
 * @returns 原本已带省略号的原样返回, 否则在去掉行尾空白后补上三个点.
 */
export function deepDivingLabel(label: string): string {
  const trimmed = label.trimEnd()
  return TRAILING_ELLIPSIS.test(trimmed) ? label : `${trimmed}...`
}
