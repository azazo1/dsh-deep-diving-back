//#region src/naming.ts
/**
* 本插件的公开标识. Host 与 Client 两个半区共用这一份, 避免三处标识漂移.
* 三处必须一致: package.json 的 name, client bundle 顶层注册的 id, bundle patch 的行 name.
*/
/** 包名, 也是浏览器半区 `__ModuleLoader__.load` 的注册 id. */
const PACKAGE_NAME = "dsh-deep-diving-back";
//#endregion
//#region src/index.ts
/** 插件模块名. */
const name = "deep-diving-back";
/**
* 记录 Host 半区已挂载.
* @param ctx - Host 插件上下文.
*/
function apply(ctx) {
	ctx.logger.info(`${PACKAGE_NAME}: browser half owns the deep-diving status row`);
}
//#endregion
export { apply, name };

//# sourceMappingURL=index.js.map