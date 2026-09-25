/**
 * 蓝色流光状态行的渲染器.
 *
 * 结构与 0.1.6 `ChatView.tsx` 的 `TurnStatus` 一致: `role="status"` 的一行文字,
 * 运行满 15 秒后在右侧补一个 aria-hidden 的计时. 锚点优先取本回合 `turn/start`
 * 的时间 (中途刷新页面也不会把计时清零), 取不到时退回挂载时间. 文案的省略号
 * 由 `status-label.ts` 补回, 见那里的说明.
 */
import { memo, useEffect, useState } from 'react'
import type { ChatNodeViewProps } from '@deepseek-ai/dsh-client-ui-chat/client'
import { CLOCK_INTERVAL_MS, clockVisible, formatRunDuration } from './run-clock.ts'
import { deepDivingLabel } from './status-label.ts'

/** 组件属性由 keyed slot 合成: 节点数据 + chat 命名空间的翻译位. */
type DeepDivingStatusProps = ChatNodeViewProps<'deep-diving-status'>

export const DeepDivingStatusView = memo(function DeepDivingStatusView({
  node, t,
}: DeepDivingStatusProps) {
  const [mountedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => { setNow(Date.now()) }, CLOCK_INTERVAL_MS)
    return () => { clearInterval(timer) }
  }, [])
  const anchor = node.data.startTime ?? mountedAt
  const elapsedMs = Math.max(0, now - anchor)
  return (
    <div className="ddb-turn-status" role="status" aria-live="polite">
      {deepDivingLabel(t('chat.deepDiving'))}
      {clockVisible(elapsedMs) && (
        <span className="ddb-turn-status-clock" aria-hidden="true">
          {formatRunDuration(elapsedMs, t)}
        </span>
      )}
    </div>
  )
})
