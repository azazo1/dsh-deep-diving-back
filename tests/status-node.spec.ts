/**
 * 节点定义的结构契约: 运行中的回合必须产出一行会话级节点, 且 anchorSeq 大于
 * 任何持久行, 保证它钉在对话流最后一行; 回合结束后必须用同 key 的 hidden 撤回
 * (assember 不允许直接返回 null).
 */
import { describe, expect, it } from 'vitest'
import type {
  ConversationLocation, ConversationNodeContext,
} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { DEEP_DIVING_STATUS_KIND } from '../src/naming.ts'
import { deepDivingStatusDefinition, type DeepDivingStatusState } from '../src/client/status-node.ts'

const TURN = 3

/** 造一个最小 context, 只填 buildViewNode 真正读取的字段. */
function contextFor(
  location: ConversationLocation | undefined,
  startTime?: number,
): ConversationNodeContext<DeepDivingStatusState> {
  const start = location === undefined ? undefined : {
    event: { type: 'turn/start', data: { turn: TURN } },
    role: 'start' as const,
    location,
  }
  return {
    key: `${DEEP_DIVING_STATUS_KIND}:${String(TURN)}`,
    kind: DEEP_DIVING_STATUS_KIND,
    id: String(TURN),
    matches: start === undefined ? [] : [start],
    start,
    state: { turn: TURN },
    current: new Map(),
  } as unknown as ConversationNodeContext<DeepDivingStatusState>
}

/** 回合级 location, 状态与起始时间可控. */
function turnLocation(status: 'open' | 'closed', startTime?: number): ConversationLocation {
  return {
    kind: 'turn',
    turn: {
      turn: TURN,
      start: startTime === undefined ? undefined : { time: startTime, seq: 10 },
      end: undefined,
      status,
      steps: [],
      data: {},
    },
  } as unknown as ConversationLocation
}

describe('deep diving status node', () => {
  it('puts a session-scoped row after every durable row while the turn is open', () => {
    const context = contextFor(turnLocation('open', 1_000))
    const node = deepDivingStatusDefinition.buildViewNode?.(context)
    expect(node).toBeDefined()
    expect(node?.key).toBe(context.key)
    expect(node?.kind).toBe(DEEP_DIVING_STATUS_KIND)
    expect(node?.target).toBe('chat')
    expect(node?.anchorSeq).toBe(Number.MAX_SAFE_INTEGER)
    expect(node?.location).toEqual({ kind: 'session' })
    expect(node?.visibility).toBe('visible')
    expect(node?.data).toEqual({ turn: TURN, startTime: 1_000 })
  })

  it('keeps the same key and hides the row once the turn closed', () => {
    const context = contextFor(turnLocation('closed', 1_000))
    const node = deepDivingStatusDefinition.buildViewNode?.(context)
    expect(node?.key).toBe(context.key)
    expect(node?.visibility).toBe('hidden')
  })

  it('produces no row outside a turn location', () => {
    expect(deepDivingStatusDefinition.buildViewNode?.(contextFor({ kind: 'session' }))).toBeNull()
    expect(deepDivingStatusDefinition.buildViewNode?.(contextFor(undefined))).toBeNull()
  })

  it('matches only the two turn boundaries', () => {
    const match = deepDivingStatusDefinition.match
    expect(match({ type: 'turn/start', data: { turn: TURN } } as never)).toEqual({ id: String(TURN), role: 'start' })
    expect(match({ type: 'turn/end', data: { turn: TURN } } as never)).toEqual({ id: String(TURN), role: 'update' })
    expect(match({ type: 'assistant/message', data: { turn: TURN, step: 1 } } as never)).toBeNull()
  })
})
