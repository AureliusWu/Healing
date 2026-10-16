# 四作品回看检索方法 v1.0.0

2026-10-14，适用 [NetLove](https://github.com/AureliusWu/NetLove)、[Healing](https://github.com/AureliusWu/Healing)、[Rain](https://github.com/AureliusWu/Rain)、[Circuit](https://github.com/AureliusWu/Circuit)。

## 玩家目标

长篇阅读后能够按关键词和说话人找回已经经历过的对话；回路还能检索已经取得的现场记录、地点和时间。多个词以空格分开，必须同时出现。关闭面板后回到原段落，重开面板清空本次筛选。

## 数据边界

检索只接受当前路线的已读记录。NetLove、Healing 使用原生 recordLine 重建的 history；Rain 使用 Ren’Py _history_list；Circuit 使用当前章节 history 和 state.evidence。界面人物选项也只从这些记录生成。检索函数不读取完整剧情图，不写存档、不授予证据和章节解锁。原有回看长度限制继续生效。

筛选前保留原记录和原索引：重复到访不合并，顺序不改变。语音绑定使用原节点或原历史索引，避免筛选后第一个结果误播原第一条语音。没有结果时显示独立空态，清除操作恢复全部已读记录。

## 可复用实现

三个 React 作品采用同字节的 src/game/history.ts、src/components/RecordSearch.tsx 和 src/history-search.css。通用组件接收已读记录与目标作品的行渲染函数；Circuit 保留自己的证据、地点、时间和声音按钮。Rain 在 game/python-packages/replay_search.py 使用同一查询约定，以原生 screen 实现输入、人物筛选与 viewport，继续由 Ren’Py 管理历史和声音。

归一化使用 NFKC、英文小写及空白拆词。例如 Ｄ３ 与 d3 匹配。Ren’Py 的显示标签由原生过滤器移除后再检索。查询只存在面板状态中，字符数限制为 80；不新增持久化字段。各作品保持已有引擎、角色、素材和存档身份。

新增界面汉字进入目标作品字体覆盖检查；React 两个使用字体子集的作品重新生成现有 OFL 字体，更新当前素材索引的字节哈希。历史版本的发行凭据保持原样。

## 回归要点

- 关键词与人物相交、全角英文、多个关键词、无结果和清除。
- 未读路线与未取得证据不出现，重复记录和原语音身份保持。
- 输入 a、h、l、s 和空格时不触发阅读快捷键；回看关闭后原段落和存档保持。
- 电脑、手机、短横屏与旋转；离线重开后检索仍可用。
- Rain 实际原生输入和筛选后的原语音重播；Circuit 声音证据仍可重听、暂停、停止。

项目测试与双端验证的实际结果写入各自本轮记录；Windows、公开 PWA 与真人试听分别留证。通用实现依照各仓 LICENSE 的 MIT 条款复用，作品专属人物、美术与录音仍按原资源约定处理。

## Rain 的浏览器输入适配

真实 WASM 回归中，SDL 画布输入未接收测试中的中文字。网页使用浏览器原生搜索框接收中文与输入法组合，通过官方命令接口只更新当前 history screen 的查询并刷新界面。人物筛选、结果、原语音与历史继续由 Ren’Py 执行；Windows 仍使用原生 input。浏览器控件使用带 OFL 许可的自托管中文字体，覆盖本轮控件和剧情关键词。启动页结束后才读取原生历史；输入进行中不以旧查询回写正在编辑的文本。
