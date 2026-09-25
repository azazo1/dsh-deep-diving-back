/**
 * 蓝色流光那一行的对话节点定义.
 *
 * 关键设计: 返回的节点声明为 **session 级 location**, 因此它不属于任何回合,
 * 既不会被官方的工作详情分组容器收进去, 也不参与回合派生态计算, 只按
 * anchorSeq 参与流内排序. anchorSeq 取最大安全整数, 于是它永远是最后一行;
 * 而客户端待处理的 steer 气泡由 ChatView 追加在所有流内行之后, 因此自然得到
 * 旧版语义: 已并入请求的持久 steer 在它之上, 尚未并入的待处理 steer 在它之下.
 */
import type { ChatNode } from '@deepseek-ai/dsh-client-ui-chat/client'
import type {
  ConversationNodeContext, ConversationNodeDefinition, TurnLocation,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { DEEP_DIVING_STATUS_KIND } from '../naming.ts'
import type { DeepDivingStatusData } from './contract.ts'

/**
 * 状态行的排序位. 必须大于任何持久行的 anchorSeq, 才能保证它钉在流尾.
 * 同一时刻只可能有一个回合处于打开状态, 因此不存在并列.
 */
const STATUS_ANCHOR = Number.MAX_SAFE_INTEGER

/** 定义局部状态: 这一份 context 归属哪个回合. */
export interface DeepDivingStatusState {
  readonly turn: number
}

/**
 * 本定义只产 chat 目标的节点, 因此把 `buildViewNode` 的返回类型收窄到
 * `ChatNode`, 消费方与测试可以直接读 anchorSeq / location / visibility.
 */
export type DeepDivingStatusDefinition = Omit<ConversationNodeDefinition<DeepDivingStatusState>, 'buildViewNode'> & {
  buildViewNode: (
    context: ConversationNodeContext<DeepDivingStatusState>,
  ) => ChatNode<typeof DEEP_DIVING_STATUS_KIND> | null
}

/** 读取本 context 当前所处的回合位置. */
function turnLocation(context: ConversationNodeContext<DeepDivingStatusState>): TurnLocation | undefined {
  const location = context.start?.location ?? context.matches[0]?.location
  return location?.kind === 'turn' || location?.kind === 'step' ? location.turn : undefined
}

/** 只在回合开始与结束时各物化一次, 稳定对象让上层不会无谓重渲染. */
function statusNode(
  context: ConversationNodeContext<DeepDivingStatusState>,
  turn: TurnLocation,
): ChatNode<typeof DEEP_DIVING_STATUS_KIND> {
  const data: DeepDivingStatusData = {
    turn: turn.turn,
    startTime: turn.start?.time,
  }
  return {
    key: context.key,
    kind: DEEP_DIVING_STATUS_KIND,
    id: context.id,
    target: 'chat',
    anchorSeq: STATUS_ANCHOR,
    location: { kind: 'session' },
    // 回合关闭后不能返回 null (已物化节点必须用 hidden 撤回), 所以只切可见性.
    visibility: turn.status === 'open' ? 'visible' : 'hidden',
    data,
  }
}

/** 运行中显示蓝色流光的回合状态行. */
export const deepDivingStatusDefinition: DeepDivingStatusDefinition = {
  kind: DEEP_DIVING_STATUS_KIND,
  target: 'chat',
  match(event) {
    if (event.type === 'turn/start') return { id: String(event.data.turn), role: 'start' }
    if (event.type === 'turn/end') return { id: String(event.data.turn), role: 'update' }
    return null
  },
  start(_context, match) {
    if (match.event.type !== 'turn/start') {
      throw new Error('deep-diving-status start requires turn/start')
    }
    return { turn: match.event.data.turn }
  },
  update(context) {
    return context.state
  },
  buildViewNode(context) {
    const turn = turnLocation(context)
    // 历史窗口里只加载到 turn/end 时会走到这里: 没有回合位置就不产出行.
    if (turn === undefined) return null
    return statusNode(context, turn)
  },
}
