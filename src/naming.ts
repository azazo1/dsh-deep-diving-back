/**
 * 本插件的公开标识. Host 与 Client 两个半区共用这一份, 避免三处标识漂移.
 * 三处必须一致: package.json 的 name, client bundle 顶层注册的 id, bundle patch 的行 name.
 */

/** 包名, 也是浏览器半区 `__ModuleLoader__.load` 的注册 id. */
export const PACKAGE_NAME = 'dsh-deep-diving-back'

/** Host 插件模块名, 用于 Loader 诊断. */
export const PLUGIN_NAME = 'deep-diving-back'

/** Loader row id, 与 cordis.patch.yml 里 insert 的那一行一致. */
export const ROW_ID = PACKAGE_NAME

/** 本插件贡献的对话节点种类. */
export const DEEP_DIVING_STATUS_KIND = 'deep-diving-status'

/** 该行文案所在的 locale 命名空间, 由 ui-chat 安装. */
export const CHAT_NAMESPACE = 'chat'
