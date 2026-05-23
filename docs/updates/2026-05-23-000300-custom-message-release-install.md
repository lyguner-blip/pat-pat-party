# Pat Pat Party 0.0.3 - 自定义亲密度

## 背景

0.0.3 是一次维护更新，主要修复 FoundryVTT 通过 manifest 在线安装时缺少 `download` URL 的问题，并继续优化 0.0.2 的三种摸头力度体验。

## 更新内容

- `module.json` 更新到 `0.0.3`，补齐 `url`、`manifest`、`download` 字段。
- 摸头力度选择 Dialog 增加自定义文案输入框，空值回退到“亲密度上升↑”。
- 自定义文案会用于 Token 上方浮动文字和聊天卡片，并进行长度限制与 HTML 转义。
- 摸头动画升级为分层 Q 版效果：小手右上滑入、左右揉搓、粒子分批冒出、文字上浮淡出。
- 三种力度继续保留差异：轻柔摸、普通摸、大力逆毛摸。
- Socket payload 增加自定义文案与校准偏移，便于多客户端同步同一次互动。
- 抱抱互动已纳入后续计划：选中队友 Token 后触发抱抱，在两个 Token 之间播放贴贴/爱心动画，并发送温暖聊天文案。

## 验证重点

- Manifest URL 可解析到带 download 字段的 `module.json`。
- Release ZIP 根目录直接包含 `module.json`。
- `scripts/main.mjs` 通过 `node --check`。
- `module.json`、`lang/en.json`、`lang/zh-CN.json` 均为合法 JSON。
