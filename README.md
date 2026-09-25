# dsh-deep-diving-back

把 DSH 0.1.6 及以前那个蓝色流光的 `深度求索中` (英文界面 `Deep diving...`) 回合运行标志加回来.

## 效果

回合运行中, 对话流最后一行是蓝色流光的 `深度求索中`, 运行满 15 秒后右侧出现计时; 回合结束后该行消失. 观感与 0.1.6 一致: DeepSeek 品牌蓝双色渐变 (`--dsw-static-deepseek-500` 与 `--dsw-static-deepseek-200`), 1.8s 线性扫光, `prefers-reduced-motion: reduce` 下退化为静态蓝色文字.

这一行钉在流尾是有语义的, 也是旧版的行为:

- steer 已经被并入当前请求时, 它是一条持久 `steering/message` 行, 排在标志之上, 也就是标志在 steer 下面.
- steer 还只是客户端待处理气泡时, 它被追加在所有流内行之后, 也就是标志在 steer 上面.

## 为什么需要它

0.1.7-alpha.1 起 (`1bcb633c3f`), 这一行换成官方那行灰色的回合流程披露行, 而且它锚定在整轮流程的**起点**. 一如有几十步的长回合, 它就落在很靠上的位置, 用户盯着的尾部只剩思考行与输入框. 本插件不改官方那一行, 只额外补一行钉在流尾的蓝色流光标志.

## 安装

web:

```shell
dsh plugin --profile web add azazo1/dsh-deep-diving-back
```

desktop 没有命令行入口, 在应用的插件页里填同一个 GitHub 仓库标识, 装完重启宿主.

装完必须重启宿主一次: Client metadata 的扫描结果在进程内缓存, 只刷新页面不会重新扫描.

## 版本要求

`peerDependencies` 写 `>=0.1.7-rc.2 <0.2.0`: 该标志在 0.1.7-alpha.1 才消失, 更低的宿主自带原版效果, 装上只会重复一行.

## 已知差异

- 官方那行灰色的 `深度求索中, 用时XX秒` 披露行保持原样, 本插件不碰它.
- 因为标志成了流内最后一行, 官方 `ChatNodeList` 里 "把本地回声插到空的回合流程控制行之前" 的那段补偿不再触发, 刚发出消息的本地回声会落在标志之下. 这正是 0.1.6 的顺序 (旧版也是先画运行状态行再画待处理气泡), 属于有意还原.
- 标志随 `turn/start` 出现, 而不是随会话的 running 状态出现, 差异在同一批客户端更新之内, 不可感知.

## 开发

```shell
just install
just verify
```

- `just build` 产出 `lib/index.js` (Host ESM) 与 `lib/client.js` (浏览器 CJS 包装, 顶层调用 `window.__ModuleLoader__.load`).
- `just test` 需要先构建: 其中一个用例会真的在 Node VM 里执行 `lib/client.js`, 校验注册 id, 依赖列表与运行期模块请求.
- 本包不对外暴露 API, 因此不产出 `.d.ts`.
- `lib/` 需要提交进版本库, 这样 git 方式安装能直接拿到构建产物, 也就不需要 `prepare` 脚本与 `allowBuilds`.

目录:

| 路径 | 职责 |
|---|---|
| `src/naming.ts` | 包名, 插件名, row id, 节点种类, locale 命名空间 |
| `src/index.ts` | Host 半区, 只负责被 Loader 激活并记录日志 |
| `src/client/status-node.ts` | 对话节点定义: 匹配回合边界, 决定可见性与排序位 |
| `src/client/status-view.tsx` | 那一行的渲染器 |
| `src/client/run-clock.ts` | 计时阈值与时长格式化 |
| `src/client/status-styles.ts` | 蓝色流光样式与一次幂等注入 |

## 来源

外观与行为照抄 `dsh-v0.1.6-alpha.2` 的 `packages/client/ui-chat/src/client/chat/ChatView.tsx` (`TurnStatus`) 与同目录 `ChatView.module.css` (`.turnStatus` / `.turnStatusClock` / `dsh-turn-status-shimmer`), 只把类名与关键帧名加 `ddb-` 前缀.

注册方式走 DSH 的公开扩展点: 一个 `ConversationNodeDefinition` (`ctx.uiConversation.events.register`) 加一个 `conversation.chat.node` 的 keyed 渲染器. 节点声明为会话级 location, 因此不属于任何回合, 不会被官方的工作详情分组容器收进去, 只按 `anchorSeq` 参与流内排序.
