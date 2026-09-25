window.__ModuleLoader__.load({
	id: "dsh-deep-diving-back",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/naming.ts
		/**
		* 本插件的公开标识. Host 与 Client 两个半区共用这一份, 避免三处标识漂移.
		* 三处必须一致: package.json 的 name, client bundle 顶层注册的 id, bundle patch 的行 name.
		*/
		/** 包名, 也是浏览器半区 `__ModuleLoader__.load` 的注册 id. */
		const PACKAGE_NAME = "dsh-deep-diving-back";
		/** 本插件贡献的对话节点种类. */
		const DEEP_DIVING_STATUS_KIND = "deep-diving-status";
		/** 该行文案所在的 locale 命名空间, 由 ui-chat 安装. */
		const CHAT_NAMESPACE = "chat";
		//#endregion
		//#region src/client/status-styles.ts
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
		/** 样式标签的稳定身份, 供 HMR 与调试识别本插件拥有的样式. */
		const STYLE_TAG_ID = `${PACKAGE_NAME}/turn-status.css`;
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
`;
		/**
		* 注入蓝色流光的样式表. 重复调用会替换上一个同名标签, 保证 disposer 始终
		* 拥有当前这一份, 卸载后不留残留样式.
		* @param doc - 目标文档, 默认当前文档.
		* @returns 移除本次注入的样式标签.
		*/
		function installTurnStatusStyles(doc = document) {
			for (const stale of doc.head.querySelectorAll(`style[data-plugin-css="${STYLE_TAG_ID}"]`)) stale.remove();
			const tag = doc.createElement("style");
			tag.dataset.plugin = PACKAGE_NAME;
			tag.dataset.pluginCss = STYLE_TAG_ID;
			tag.textContent = TURN_STATUS_CSS;
			doc.head.appendChild(tag);
			return () => {
				tag.remove();
			};
		}
		//#endregion
		//#region src/client/status-node.ts
		/**
		* 状态行的排序位. 必须大于任何持久行的 anchorSeq, 才能保证它钉在流尾.
		* 同一时刻只可能有一个回合处于打开状态, 因此不存在并列.
		*/
		const STATUS_ANCHOR = Number.MAX_SAFE_INTEGER;
		/** 读取本 context 当前所处的回合位置. */
		function turnLocation(context) {
			const location = context.start?.location ?? context.matches[0]?.location;
			return location?.kind === "turn" || location?.kind === "step" ? location.turn : void 0;
		}
		/** 只在回合开始与结束时各物化一次, 稳定对象让上层不会无谓重渲染. */
		function statusNode(context, turn) {
			const data = {
				turn: turn.turn,
				startTime: turn.start?.time
			};
			return {
				key: context.key,
				kind: DEEP_DIVING_STATUS_KIND,
				id: context.id,
				target: "chat",
				anchorSeq: STATUS_ANCHOR,
				location: { kind: "session" },
				visibility: turn.status === "open" ? "visible" : "hidden",
				data
			};
		}
		/** 运行中显示蓝色流光的回合状态行. */
		const deepDivingStatusDefinition = {
			kind: DEEP_DIVING_STATUS_KIND,
			target: "chat",
			match(event) {
				if (event.type === "turn/start") return {
					id: String(event.data.turn),
					role: "start"
				};
				if (event.type === "turn/end") return {
					id: String(event.data.turn),
					role: "update"
				};
				return null;
			},
			start(_context, match) {
				if (match.event.type !== "turn/start") throw new Error("deep-diving-status start requires turn/start");
				return { turn: match.event.data.turn };
			},
			update(context) {
				return context.state;
			},
			buildViewNode(context) {
				const turn = turnLocation(context);
				if (turn === void 0) return null;
				return statusNode(context, turn);
			}
		};
		//#endregion
		//#region src/client/run-clock.ts
		/** 计时出现阈值, 与 0.1.6 的 TurnStatus 一致. */
		const CLOCK_VISIBLE_AFTER_MS = 15e3;
		/** 时钟刷新间隔. */
		const CLOCK_INTERVAL_MS = 1e3;
		function pad2(value) {
			return String(value).padStart(2, "0");
		}
		/**
		* 本地化的已运行时长.
		* @param ms - 已运行毫秒数, 负数按零处理.
		* @param t - chat 命名空间的翻译位.
		* @returns 不足一分钟为秒, 满一分钟为分加两位秒, 满一小时为时加两位分秒.
		*/
		function formatRunDuration(ms, t) {
			const total = Math.max(0, Math.floor(ms / 1e3));
			const hours = Math.floor(total / 3600);
			const minutes = Math.floor(total / 60) % 60;
			const seconds = total % 60;
			if (hours > 0) return t("duration.hours", {
				hours,
				minutes: pad2(minutes),
				seconds: pad2(seconds)
			});
			return minutes > 0 ? t("duration.minutes", {
				minutes,
				seconds: pad2(seconds)
			}) : t("duration.seconds", { seconds });
		}
		/**
		* 计时是否已经该出现.
		* @param elapsedMs - 已运行毫秒数.
		* @returns 是否达到阈值.
		*/
		function clockVisible(elapsedMs) {
			return elapsedMs >= CLOCK_VISIBLE_AFTER_MS;
		}
		//#endregion
		//#region src/client/status-label.ts
		/**
		* 还原 0.1.6 的状态文案.
		*
		* `1bcb633c3f` (0.1.7-alpha.1) 连同蓝色流光一起把中文串的省略号去掉了
		* (旧: `深度求索中...`, 新: `深度求索中`), 英文串两个版本都带省略号.
		* 这里只在缺失时补回, 不去改动 chat 命名空间的字典.
		*/
		/** 已经以省略号 (半角三点或单字符省略号) 结尾. */
		const TRAILING_ELLIPSIS = /(?:\.{3}|…)$/;
		/**
		* 让状态文案与 0.1.6 一致地以省略号结尾.
		* @param label - 当前 locale 的 `chat.deepDiving` 文案.
		* @returns 原本已带省略号的原样返回, 否则在去掉行尾空白后补上三个点.
		*/
		function deepDivingLabel(label) {
			const trimmed = label.trimEnd();
			return TRAILING_ELLIPSIS.test(trimmed) ? label : `${trimmed}...`;
		}
		//#endregion
		//#region src/client/status-view.tsx
		/**
		* 蓝色流光状态行的渲染器.
		*
		* 结构与 0.1.6 `ChatView.tsx` 的 `TurnStatus` 一致: `role="status"` 的一行文字,
		* 运行满 15 秒后在右侧补一个 aria-hidden 的计时. 锚点优先取本回合 `turn/start`
		* 的时间 (中途刷新页面也不会把计时清零), 取不到时退回挂载时间. 文案的省略号
		* 由 `status-label.ts` 补回, 见那里的说明.
		*/
		const DeepDivingStatusView = (0, react.memo)(function DeepDivingStatusView({ node, t }) {
			const [mountedAt] = (0, react.useState)(() => Date.now());
			const [now, setNow] = (0, react.useState)(() => Date.now());
			(0, react.useEffect)(() => {
				const timer = setInterval(() => {
					setNow(Date.now());
				}, CLOCK_INTERVAL_MS);
				return () => {
					clearInterval(timer);
				};
			}, []);
			const anchor = node.data.startTime ?? mountedAt;
			const elapsedMs = Math.max(0, now - anchor);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "ddb-turn-status",
				role: "status",
				"aria-live": "polite",
				children: [deepDivingLabel(t("chat.deepDiving")), clockVisible(elapsedMs) && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
					className: "ddb-turn-status-clock",
					"aria-hidden": "true",
					children: formatRunDuration(elapsedMs, t)
				})]
			});
		});
		//#endregion
		//#region src/client/index.ts
		/** 需要的宿主服务: 槽位注册表与对话节点注册表. */
		const inject = ["slots", "uiConversation"];
		/**
		* 注册蓝色流光状态行.
		* @param ctx - 浏览器插件上下文.
		*/
		function apply(ctx) {
			ctx.effect(() => installTurnStatusStyles(), `${PACKAGE_NAME}: turn status styles`);
			ctx.effect(() => ctx.uiConversation.events.register(deepDivingStatusDefinition), `${PACKAGE_NAME}: turn status node`);
			ctx.effect(() => ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
				name: "conversation.chat.node",
				key: DEEP_DIVING_STATUS_KIND,
				locale: CHAT_NAMESPACE
			}, DeepDivingStatusView)), `${PACKAGE_NAME}: turn status renderer`);
			ctx.logger.info(`${PACKAGE_NAME}: deep-diving status row registered`);
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map