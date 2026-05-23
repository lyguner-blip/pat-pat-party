# Pat Pat Party / 摸摸头小队

Pat Pat Party（摸摸头小队）是一个轻量、可爱、不打断跑团流程的 FoundryVTT Token 互动模组。玩家可以通过 Token HUD 对队友或允许的目标使用“摸摸头”，画布上会出现短动画，并可在聊天栏发送温暖的小文案。

当前版本：`0.0.4 - PIXI 摸头动画优化`(感谢三耳老师的大力挥鞭）

English summary: a tiny system-agnostic FoundryVTT module for cute token pat-pat animations and localized chat messages.

## 功能列表

- 在 Token HUD 上添加“摸摸头”按钮和“校准摸头位置”按钮。
- 点击“摸摸头”后选择三种力度：轻柔摸、普通摸、大力逆毛摸。
- 在力度选择窗口中自定义一句摸头文案，默认是“亲密度上升↑”。
- 自定义文案会同时显示为 Token 上方浮动文字和聊天卡片内容。
- 优先使用 PIXI/Canvas 临时容器播放小手从右上滑入、左右揉搓、上浮淡出的 Q 版动画。
- 爱心、小花、星星粒子会分批冒出，并按三种力度改变数量和幅度。
- 支持为每个 Token 持久化校准摸头位置，数据保存到 Token Document flag。
- 使用 Foundry socket 广播动画，让同场景在线玩家也能看到。
- 可选发送本地化聊天卡片。
- 每位用户对每个目标 Token 独立冷却，避免刷屏。
- GM 可摸任何 Token，普通玩家受拥有权限、敌对 Token 和世界设置控制。
- 系统无关，不依赖 dnd5e、Sequencer、JB2A 或第三方模组。

## 安装方式

### Manifest 安装

在 FoundryVTT 的“安装模组”窗口中粘贴 Manifest URL：

```text
https://raw.githubusercontent.com/lyguner-blip/pat-pat-party/main/module.json
```

`module.json` 中的下载地址指向 GitHub Release ZIP：

```text
https://github.com/lyguner-blip/pat-pat-party/releases/download/v0.0.4/pat-pat-party-0.0.4.zip
```

### 手动安装

1. 从 GitHub Release 下载 `pat-pat-party-0.0.4.zip`。
2. 解压后确认目录名为 `pat-pat-party`，且目录内直接包含 `module.json`。
3. 将 `pat-pat-party` 文件夹放入 Foundry 的 `Data/modules/` 目录。
4. 重启 FoundryVTT，进入世界后在“管理模组”中启用 `Pat Pat Party`。

## 使用方式

1. 在画布上打开目标 Token 的 Token HUD。
2. 点击手掌闪光图标按钮。
3. 在弹出的窗口中输入可选文案，并选择轻柔摸、普通摸或大力逆毛摸。
4. 若权限与冷却检查通过，目标 Token 上方会播放对应力度的摸摸头动画。
5. 若启用了聊天消息，聊天栏会出现同一句摸头文案。
6. 如动画位置不准，点击 Token HUD 上的准星按钮，调整 X/Y 偏移并保存。

## 三种力度

- **轻柔摸**：约 1.4 秒，小手慢慢滑入并轻轻揉搓 2 次，粒子较少，Token 反馈很轻。
- **普通摸**：约 1.2 秒，默认推荐效果，揉搓 3 次，爱心、小花、星星数量适中。
- **大力逆毛摸**：约 1.3 秒，揉搓 4–5 次，幅度更明显，会冒出更多星星和乱毛感弧线，但仍保持可爱互动，不表现为攻击。

## 设置说明

- **允许玩家摸其他 Token**：允许非 GM 用户摸自己不拥有的 Token。
- **允许摸敌对 Token**：允许非 GM 用户摸敌对 disposition 的 Token。默认关闭。
- **显示聊天消息**：是否发送聊天卡片。默认开启。
- **冷却秒数**：每位用户对每个目标 Token 的独立冷却，范围 0–300 秒，默认 10 秒。
- **默认摸头力度**：可选轻柔摸、普通摸、大力逆毛摸，默认普通摸。

## 兼容性

- 目标 FoundryVTT：v13+
- 尽量兼容 FoundryVTT v14
- 系统无关
- 使用 ES Modules
- 不依赖第三方模组

## 已知限制

- 动画是客户端 PIXI/Canvas 临时容器，不会创建真实测量模板、特效对象或 Active Effect；极端情况下会退回 DOM overlay。
- 动画位置基于 Token 头顶 world 坐标，并叠加 Token 的 `patOffset` flag；播放中会尽量跟随 Token 与画布缩放。
- Token 反馈会尽量轻微作用于当前客户端的 Token 视觉层；如果 Foundry 内部渲染对象不可用，会自动只播放特效层。
- 自定义文案会被压缩空白并限制在 40 个字符内，聊天和浮动文字都会进行 HTML 转义。
- 冷却保存在客户端内存中，刷新页面或重新进入世界后会重置。
- Socket 同步只负责动画广播，聊天消息由触发者创建一次。
- 普通玩家校准自己没有文档权限的 Token 时，需要至少一名 GM 在线代写 Token flag。

## 后续计划

- 抱抱互动已进入后续开发计划：选中队友 Token → 抱抱 → 两个 Token 之间出现贴贴/爱心动画 → 聊天栏提示温暖文案。
- 更多互动动作：击掌、拍肩、递茶、送花。
- 自定义动画图标。
- 角色关系/权限细分。
- 与 Dice So Nice / Sequencer 可选集成。

## 开发说明

核心入口在 `scripts/main.mjs`，样式在 `styles/pat-pat-party.css`，本地化文本在 `lang/en.json` 与 `lang/zh-CN.json`。

静态检查建议：

```powershell
node --check .\scripts\main.mjs
Get-Content .\module.json | ConvertFrom-Json
Get-Content .\lang\en.json | ConvertFrom-Json
Get-Content .\lang\zh-CN.json | ConvertFrom-Json
```
