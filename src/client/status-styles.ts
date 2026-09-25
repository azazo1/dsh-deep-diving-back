/**
 * 蓝色流光样式.
 *
 * 外部插件没有官方那套 Client 构建预设 (它把 `.module.css` 编译成哈希类名并注入),
 * 所以这一份样式由插件自己拥有: 一段纯 CSS 文本加一次幂等的注入.
 * CSS 内容照抄 0.1.6 `ChatView.module.css` 的 `.turnStatus` / `.turnStatusClock` /
 * `dsh-turn-status-shimmer` / reduced-motion 块, 只做两处必要改动:
 *   1. 类名与关键帧名加 `ddb-` 前缀. 关键帧名不参与 CSS Modules 哈希, 必须自己防撞.
 *   2. 颜色与字体仍走宿主 token, 不写字面色值.
 */
import { PACKAGE_NAME } from '../naming.ts'

/** 样式标签的稳定身份, 供 HMR 与调试识别本插件拥有的样式. */
const STYLE_TAG_ID = `${PACKAGE_NAME}/turn-status.css`

/** 注入用的样式文本. */
const TURN_STATUS_CSS = `
.ddb-turn-status {
  align-self: flex-start;
  flex: none;
  display: inline-flex;
  align-items: center;
  height: calc(26px + var(--dsh-content-font-delta, 0px));
  font: var(--dsw-font-s-strong-14);
  font-size: var(--dsh-content-font-size, 14px);
  line-height: calc(22px + var(--dsh-content-font-delta, 0px));
  white-space: nowrap;
  background: linear-gradient(
    90deg,
    var(--dsw-static-deepseek-500) 0%,
    var(--dsw-static-deepseek-500) 40%,
    var(--dsw-static-deepseek-200) 50%,
    var(--dsw-static-deepseek-500) 60%,
    var(--dsw-static-deepseek-500) 100%
  );
  background-position: 100% 0;
  background-size: 250% 100%;
  background-clip: text;
  color: transparent;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: ddb-turn-status-shimmer 1.8s linear infinite;
}

.ddb-turn-status-clock {
  margin-left: 8px;
  font: var(--dsw-font-xs-13);
  font-size: var(--dsh-content-font-size-secondary, 13px);
  line-height: calc(20px + var(--dsh-content-font-delta-secondary, 0px));
  font-weight: 400;
  font-variant-numeric: tabular-nums;
  color: var(--dsw-alias-label-caption);
  -webkit-text-fill-color: var(--dsw-alias-label-caption);
}

@keyframes ddb-turn-status-shimmer {
  to {
    background-position: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ddb-turn-status {
    background-position: 0 0;
    background-size: 100% 100%;
    animation: none;
  }
}
`

/**
 * 注入蓝色流光的样式表. 重复调用会替换上一个同名标签, 保证 disposer 始终
 * 拥有当前这一份, 卸载后不留残留样式.
 * @param doc - 目标文档, 默认当前文档.
 * @returns 移除本次注入的样式标签.
 */
export function installTurnStatusStyles(doc: Document = document): () => void {
  for (const stale of doc.head.querySelectorAll(`style[data-plugin-css="${STYLE_TAG_ID}"]`)) {
    stale.remove()
  }
  const tag = doc.createElement('style')
  tag.dataset.plugin = PACKAGE_NAME
  tag.dataset.pluginCss = STYLE_TAG_ID
  tag.textContent = TURN_STATUS_CSS
  doc.head.appendChild(tag)
  return () => {
    tag.remove()
  }
}
