/**
 * 本插件节点的渲染数据, 以及把它合并进 ui-chat 的公开节点数据登记表.
 * 合并成功后 `ChatNodeKind` 才会包含本插件的种类, keyed slot 的注册与组件
 * 属性类型才有正确的收窄.
 */
import type { ChatNodeDataMap } from '@deepseek-ai/dsh-client-ui-chat/client'
import { DEEP_DIVING_STATUS_KIND } from '../naming.ts'

/** 蓝色流光状态行的渲染数据. */
export interface DeepDivingStatusData {
  /** 归属的回合号. */
  readonly turn: number
  /** 该回合 `turn/start` 的日志时间, 缺失时由组件用挂载时间兜底. */
  readonly startTime: number | undefined
}

declare module '@deepseek-ai/dsh-client-ui-chat/client' {
  interface ChatNodeDataMap {
    /** 运行中的蓝色流光状态行. */
    'deep-diving-status': DeepDivingStatusData
  }
}

/** 合并进来的键必须与公开常量一致. */
type StatusKindIsDeclared = typeof DEEP_DIVING_STATUS_KIND extends keyof ChatNodeDataMap ? true : never

/** 编译期守卫, 常量改名而忘记改上面的声明时这里会编译失败. */
export type _StatusKindIsDeclared = StatusKindIsDeclared
