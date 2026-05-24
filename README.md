# Pat Pat Party / 摸摸头小队

Pat Pat Party（摸摸头小队）是一个轻量、可爱、不打断跑团流程的 FoundryVTT Token 互动模组。玩家可以通过 Token HUD 对队友或允许的目标使用“摸摸头”，画布上会出现短动画，并可在聊天栏发送温暖的小文案。

当前版本：`0.0.6 - 队友目标互动与互动菜单`

English summary: a tiny system-agnostic FoundryVTT module for cute token pat-pat animations and localized chat messages.

## 功能列表

- 在 Token HUD 上添加一个统一“互动”按钮和独立“校准摸头位置”按钮。
- 统一互动菜单内包含：摸摸头、抱抱、碰拳、送花、递茶。
- 抱抱可让一个已选中/归属自己的 Token 与目标 Token 触发贴贴互动。
- 碰拳可让两个 Token 的小拳头从两侧对撞，绽出冲击圈、星星和鼓气粒子。
- 送花可向目标 Token 送出小花动画和聊天卡片。
- 递茶可向目标 Token 送出茶杯、热气和绿叶粒子动画。
- 支持“先 target 队友，再打开自己 Token HUD 点击互动”的流程，玩家之间不需要互相拥有角色。
- 点击“摸摸头”后选择三种力度：轻柔摸、普通摸、大力逆毛摸。
- 在力度选择窗口中自定义一句摸头文案，默认是“亲密度上升↑”。
- 自定义文案会同时显示为 Token 上方浮动文字和聊天卡片内容。
- 优先使用 PIXI/Canvas 临时容器播放小手从右上滑入、左右揉搓、上浮淡出的 Q 版动画。
- 爱心、小花、星星粒子会分批冒出，并按三种力度改变数量和幅度。
- 抱抱互动会在两个 Token 中间播放贴贴弧线、抱抱表情、爱心和粒子，并发送温暖聊天卡片。
- 碰拳互动会在两个 Token 中间播放拳头对撞、冲击圈和星星粒子，适合接力、鼓气或庆贺。
- 送花互动会在目标 Token 头顶播放花束、小花、爱心和星星粒子。
- 递茶互动会在目标 Token 头顶播放茶杯、热气、绿叶和星星粒子。
- 聊天卡片显式锁定文字颜色和透明度，避免被 Foundry 主题样式压淡。
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
https://github.com/lyguner-blip/pat-pat-party/releases/download/v0.0.6/pat-pat-party-0.0.6.zip
```

### 手动安装

1. 从 GitHub Release 下载 `pat-pat-party-0.0.6.zip`。
2. 解压后确认目录名为 `pat-pat-party`，且目录内直接包含 `module.json`。
3. 将 `pat-pat-party` 文件夹放入 Foundry 的 `Data/modules/` 目录。
4. 重启 FoundryVTT，进入世界后在“管理模组”中启用 `Pat Pat Party`。

## 使用方式

1. 如果能打开目标 Token 的 HUD，可直接打开目标 Token HUD；如果不能，先 target 队友 Token，再打开自己 Token 的 HUD。
2. 点击统一互动按钮。
3. 在互动菜单中选择“摸摸头”。
4. 在弹出的窗口中输入可选文案，并选择轻柔摸、普通摸或大力逆毛摸。
4. 若权限与冷却检查通过，目标 Token 上方会播放对应力度的摸摸头动画。
5. 若启用了聊天消息，聊天栏会出现同一句摸头文案。
6. 如动画位置不准，点击 Token HUD 上的准星按钮，调整 X/Y 偏移并保存。

### 抱抱

1. 先选中一个自己拥有的 Token 作为抱抱发起者。
2. target 队友 Token 后打开自己 Token 的 HUD，或直接打开另一个 Token 的 Token HUD。
3. 点击统一互动按钮并选择“抱抱”。
4. 输入可选文案后确认“抱抱”。
5. 两个 Token 中间会播放贴贴/爱心动画；如果启用了聊天消息，聊天栏会显示同一句文案。

### 碰拳

1. 先选中一个自己拥有的 Token 作为碰拳发起者。
2. target 队友 Token 后打开自己 Token 的 HUD，或直接打开另一个 Token 的 Token HUD。
3. 点击统一互动按钮并选择“碰拳”。
4. 输入可选文案后确认“碰拳”。
5. 两个 Token 中间会出现小拳头对撞、冲击圈和星星粒子；如果启用了聊天消息，聊天栏会显示同一句文案。

### 送花

1. 如果不能直接打开队友 Token HUD，先 target 队友 Token，再打开自己 Token 的 HUD。
2. 点击统一互动按钮并选择“送花”。
3. 输入可选文案后确认“送花”。
4. 目标 Token 头顶会播放花束和小花粒子；如果启用了聊天消息，聊天栏会显示同一句文案。

### 递茶

1. 如果不能直接打开队友 Token HUD，先 target 队友 Token，再打开自己 Token 的 HUD。
2. 点击统一互动按钮并选择“递茶”。
3. 输入可选文案后确认“递茶”。
4. 目标 Token 头顶会播放茶杯、热气和绿叶粒子；如果启用了聊天消息，聊天栏会显示同一句文案。

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
- 中文语言包同时注册 `cn` 与 `zh-CN`，以兼容常见 Foundry 中文汉化补丁环境。

## 已知限制

- 动画是客户端 PIXI/Canvas 临时容器，不会创建真实测量模板、特效对象或 Active Effect；极端情况下会退回 DOM overlay。
- 动画位置基于 Token 头顶 world 坐标，并叠加 Token 的 `patOffset` flag；播放中会尽量跟随 Token 与画布缩放。
- Token 反馈会尽量轻微作用于当前客户端的 Token 视觉层；如果 Foundry 内部渲染对象不可用，会自动只播放特效层。
- 自定义文案会被压缩空白并限制在 40 个字符内，聊天和浮动文字都会进行 HTML 转义。
- 冷却保存在客户端内存中，刷新页面或重新进入世界后会重置。
- Socket 同步只负责动画广播，聊天消息由触发者创建一次。
- 普通玩家校准自己没有文档权限的 Token 时，需要至少一名 GM 在线代写 Token flag。
- 当自己的 Token HUD 中只有一个其他 Token 被 target 时，摸头、抱抱、碰拳、送花和递茶会优先作用到这个 target Token。
- 抱抱互动需要解析一个不同于目标的发起 Token；普通玩家通常需要先选中或打开自己拥有的 Token。

## 后续计划

- 抱抱互动基础版已加入，后续会继续打磨双 Token 动画表现与选择流程。
- 更多互动动作：击掌、拍肩。
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
