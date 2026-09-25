/**
 * 浏览器半区入口. 构建时由 banner/footer 包成
 * `window.__ModuleLoader__.load({ id, factory })`, 这里的导出就是 factory 的返回值.
 *
 * 三处注册互相独立, 各自作为 effect 在上层卸载或 HMR 重载时清理:
 *   1. 样式注入, 让那一行有蓝色流光;
 *   2. 对话节点定义, 让运行中的回合物化出这一行;
 *   3. keyed 渲染器, 决定这一行长什么样.
 */
import type { Context } from '@deepseek-ai/cordis'
// 类型期依赖: 引入 ctx.slots 与 ctx.uiConversation 的服务声明合并.
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import { CHAT_NAMESPACE, DEEP_DIVING_STATUS_KIND, PACKAGE_NAME } from '../naming.ts'
import { installTurnStatusStyles } from './status-styles.ts'
import { deepDivingStatusDefinition } from './status-node.ts'
import { DeepDivingStatusView } from './status-view.tsx'

/** 需要的宿主服务: 槽位注册表与对话节点注册表. */
export const inject = ['slots', 'uiConversation']

/**
 * 注册蓝色流光状态行.
 * @param ctx - 浏览器插件上下文.
 */
export function apply(ctx: Context): void {
  ctx.effect(
    () => installTurnStatusStyles(),
    `${PACKAGE_NAME}: turn status styles`,
  )
  ctx.effect(
    () => ctx.uiConversation.events.register(deepDivingStatusDefinition),
    `${PACKAGE_NAME}: turn status node`,
  )
  ctx.effect(
    () => ctx.slots.inject('conversation.chat.node', () => ctx.slots.register({
      name: 'conversation.chat.node',
      key: DEEP_DIVING_STATUS_KIND,
      locale: CHAT_NAMESPACE,
    }, DeepDivingStatusView)),
    `${PACKAGE_NAME}: turn status renderer`,
  )
  ctx.logger.info(`${PACKAGE_NAME}: deep-diving status row registered`)
}
