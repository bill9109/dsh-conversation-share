# dsh-conversation-share — DSH 对话分享截图插件

> ⚠️ **本仓库为 PRIVATE（私有）。** 请勿把仓库可见性改为 public，也不要外泄内测版本。

把 DeepSeek Harness 对话流中选中的一段，渲染成带品牌尾部的 PNG 长图分享出去。

## 功能

- 对话/轨迹标签行最右侧的分享按钮（`[分享][取消][确认]`，点击后分享左移、取消/确认出现在右侧）
- 两个可拖动的范围标记把手（横向标签：「从这里开始」/「到这里结束」），支持磁性吸附
  - 吸附点 = 语义消息行 + markdown 块（p/pre/ul/li/table/标题）+ 视觉盒子（代码块/卡片）+ 内容级按钮（产物文件 chip）+ 段落内部每一行文本
  - 开始端吸元素**顶边**，结束端吸元素**底边**；两个把手不可交叉
  - 吸附提示 = 淡蓝半透明圆角矩形填充（扁平风格）
- 滚动模型：视口内把手 1:1 跟手不滚屏；指针进入顶部/底部边缘区（64px）才带动页面滚动（穿透深度钳制、帧率无关），离开即停；点按不滚（需真实拖动 ≥8px）
- 截图：40pt 主题底色留白（四周对称）+ 底部 DeepSeek Harness 品牌图标（含 BETA 徽标文字）；超长内容分块渲染拼接，绕过 canvas 高度上限
- 预览弹窗：图片宽度自适应、纵向滚动查看、下载 PNG、复制图片

## 目录结构

```
dsh-conversation-share/
├── src/
│   ├── index.ts              # 插件 host 半部（no-op）
│   ├── client/               # 浏览器半部（client bundle 入口 src/client/index.ts）
│   │   ├── index.ts          # apply(ctx)：挂载分享流程
│   │   ├── controller.ts     # 分享按钮/取消确认/模式切换/截图编排
│   │   ├── markers.ts        # 范围标记把手（吸附、滚动、状态机）
│   │   ├── snap-targets.ts   # 吸附目标收集（行/块/行级文本/内容按钮 + 位置去重）
│   │   ├── capture.ts        # 截图管线（分块、裁剪、拼接、品牌尾部）
│   │   ├── brand.ts          # 品牌 SVG 克隆（var() 烘焙 + clip-path 中和）
│   │   ├── modal.ts          # 预览弹窗 + 下载/复制
│   │   ├── dom.ts / theme.ts / icons.ts / toast.ts
│   └── vendor/html-to-image/ # 内嵌的 html-to-image 1.11.13（MIT，见其 LICENSE）
├── scripts/build.mjs         # 构建脚本（链接 DSH checkout 依赖 → tsc → tsdown）
├── lib/                      # 构建产物（client.js 为浏览器 bundle，随仓库提交）
├── package.json              # dsh.bundle + dsh.client 声明
├── cordis.patch.yml          # bundle patch（插入 conversation-share 插件）
├── tsconfig.json / tsdown.config.mjs
└── tests/                    # （预留）
```

## 构建

需要一份 DSH checkout（官方仓库或快照目录均可）：

```sh
DSH_CHECKOUT=/path/to/dsh-checkout node scripts/build.mjs
# 或通过 pnpm：
DSH_CHECKOUT=/path/to/dsh-checkout pnpm run build
```

脚本会临时把 DSH checkout 的 `node_modules` 软链到本目录（构建结束自动清理），依次执行 `tsc`（类型检查）和 `tsdown`（产出 `lib/index.js` + `lib/client.js`）。

## 安装

### 从私有仓库安装（发布）

1. 在 `~/.dsh/profiles/web/package.json` 的 `dependencies` 加：

   ```json
   "@dsh-external/dsh-conversation-share": "github:dsh-external/dsh-conversation-share#main"
   ```

   并在 `dsh.profile.bundles` 数组末尾加 `"@dsh-external/dsh-conversation-share"`。

2. 在 profile 目录执行 `pnpm install`。

3. 重启 web，浏览器**硬刷新**（Cmd+Shift+R）。

> 私有仓库安装需要 git 认证：先 `gh auth login` 再 `gh auth setup-git`（HTTPS 走 gh 凭据），或配置 GitHub Personal Access Token。

### 本地开发（link:）

1. 在 `~/.dsh/profiles/web/package.json` 的 `dependencies` 加：

   ```json
   "@dsh-external/dsh-conversation-share": "link:/绝对/路径/dsh-conversation-share"
   ```

   并在 `dsh.profile.bundles` 数组末尾加 `"@dsh-external/dsh-conversation-share"`。

2. 在 profile 目录执行 `pnpm install`（建立 node_modules 链接）。

3. 重启 web，浏览器**硬刷新**（Cmd+Shift+R）。

## 发布

1. 确保构建产物是最新的：

   ```sh
   DSH_CHECKOUT=/path/to/dsh-checkout node scripts/build.mjs
   ```

2. 提交并推送到 `main`（`lib/` 作为预构建产物一并提交，消费者装包时无需 DSH checkout）：

   ```sh
   git add .
   git commit -m "release v0.1.x"
   git push origin main
   ```

> ⚠️ 仓库为 PRIVATE，请勿改为 public。

## 开发说明

- **架构**：`dsh.bundle`（cordis.patch.yml 插入插件节点）+ `dsh.client`（浏览器 bundle，经 `window.__ModuleLoader__.load` 加载）。浏览器半部纯 DOM 操作，不修改 DSH 源码。
- **调试**：`window.__dshShareDebug.captureRange(params)` 暴露截图管线（浏览器控制台可直接调用）。
- **已解决的坑**（改动时注意）：
  - html-to-image 会把节点完整计算样式复制进 SVG 克隆 → 离屏 wrapper 的 `position:fixed; left:-100000px` 会导致内容空白；对克隆用 `style: {position:'static', left:0, top:0}` 中和。
  - 对话流是 flex column + gap:16px → 截图克隆容器必须镜像 flex 布局（否则行间距丢失）。
  - 品牌 SVG 的 `var()` fill 在隔离 SVG 图片中不解析 → 需从原始 DOM 元素读取计算色并烘焙；`clip-path: url(#...)` 引用在 SVG 图片中失效 → 克隆时移除。
  - 吸附目标坐标用**流内坐标**（rect.top + scrollTop），滚动不影响；块级吸附渲染时锚定元素实时 rect。
  - 吸附后的把手线放进滚动内容层（flow 坐标）随内容原生滚动，触控板惯性滚动不抖；把手 pill 留在固定层保持视口内可拖。
  - 范围外的文字变灰用 CSS Custom Highlight API（`::highlight`），只读 DOM 不改结构，不与吸附收集器冲突。
  - `currentRange` 的结束元素归属条件曾写反导致长范围导出只剩最后几行（已修）。
- **性能**：吸附目标在激活/内容变更时重建；拖拽每帧二分查找最近目标；边缘滚动用 rAF + 帧时距缩放（ProMotion 120Hz 不翻倍）。

## License

BSD-3-Clause（vendored html-to-image 为 MIT，见 `src/vendor/html-to-image/LICENSE`）。
