/**
 * Host 半区. 本插件的全部效果由浏览器半区注册到已有的对话流 slot 上,
 * Host 侧只需要一个可被 Loader 激活的行, 以及一条表明自己已挂载的日志.
 */
import type { Context } from '@deepseek-ai/cordis'
import { PACKAGE_NAME, PLUGIN_NAME } from './naming.ts'

/** 插件模块名. */
export const name = PLUGIN_NAME

/**
 * 记录 Host 半区已挂载.
 * @param ctx - Host 插件上下文.
 */
export function apply(ctx: Context): void {
  ctx.logger.info(`${PACKAGE_NAME}: browser half owns the deep-diving status row`)
}
