# dsh-conversation-share

[![Release v0.1.1](https://img.shields.io/badge/release-v0.1.1-5B4CF0?style=flat-square)](https://github.com/bill9109/dsh-conversation-share/releases/tag/v0.1.1)
[![License: BSD-3-Clause](https://img.shields.io/badge/license-BSD--3--Clause-0B7285?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-%5E20%20%7C%20%3E%3D22-339933?style=flat-square&logo=nodedotjs&logoColor=white)](package.json)
[![DSH profiles](https://img.shields.io/badge/DSH-Web-5B4CF0?style=flat-square)](cordis.patch.yml)

**安装：** `dsh plugin --profile web add github:bill9109/dsh-conversation-share`

**把 DeepSeek Harness 对话流中选中的一段，渲染成带品牌尾部的 PNG 长图分享出去。**

[English](README.md) | 中文

## 为什么需要它

对话历史活在 DSH Web UI 里，分享其中有意义的一段通常靠手动拼截图——裁剪、错位、没有品牌和上下文。这个插件让你用两个可拖动、带磁性吸附的范围标记，精确选中一段对话，渲染成一张带 DeepSeek Harness 品牌尾部的精致 PNG 长图。

## 截图

<img width="1512" height="745" alt="image" src="https://github.com/user-attachments/assets/8f7928d4-f6a0-493f-88de-a5d844b9d38c" />
<img width="1512" height="746" alt="image" src="https://github.com/user-attachments/assets/8d48eacf-b417-4056-bc0f-668d9161141b" />

## 功能

- 右上角 Session log 按钮左侧的**分享胶囊**（与 log 同款样式，点击后激活为蓝色高亮，`[取消][确认]` 在分享左侧展开）
- **两个可拖动的范围标记把手**（横向标签：「从这里开始」/「到这里结束」），支持磁性吸附
  - 吸附点 = 语义消息行 + markdown 块（p/pre/ul/li/table/标题）+ 视觉盒子（代码块/卡片）+ 内容级按钮（产物文件 chip）+ 段落内部每一行文本
  - 开始端吸元素**顶边**，结束端吸元素**底边**；两个把手不可交叉
  - 吸附提示 = 淡蓝半透明圆角矩形填充（扁平风格）
- **滚动模型**：视口内把手 1:1 跟手不滚屏；指针进入顶部/底部边缘区（64px）才带动页面滚动（穿透深度钳制、帧率无关），离开即停；点按不滚（需真实拖动 ≥8px）
- **截图**：40pt 主题底色留白（四周对称）+ 底部 DeepSeek Harness 品牌图标（含 BETA 徽标文字）；超长内容分块渲染拼接，绕过 canvas 高度上限
- **预览弹窗**：图片宽度自适应、纵向滚动查看、下载 PNG、复制图片

## 使用

1. 点击右上角 Session log 按钮左侧的分享胶囊，激活（蓝色高亮），`[取消][确认]` 出现在左侧
2. 拖动两个范围标记选中对话区间——它们会吸附到消息行、markdown 块和行级文本；开始端吸顶边、结束端吸底边
3. 点**确认**渲染选区为 PNG 长图（超长内容自动分块拼接）
4. 在预览弹窗里查看结果：下载 PNG 或复制图片到剪贴板

## 安装

用标准的 `dsh plugin` 命令安装到 web profile（无需改源码、无需手动编辑 package.json）：

```sh
dsh plugin --profile web add github:bill9109/dsh-conversation-share

# 或指定分支/提交
dsh plugin --profile web add github:bill9109/dsh-conversation-share#main

# 或从本地 checkout 安装（开发调试，改完重新构建即生效）
dsh plugin --profile web add /path/to/your/dsh-conversation-share
```

命令内部 = 在 profile 目录执行 `pnpm add <spec>` + 自动把声明了 `dsh.bundle` 的包追加进 `dsh.profile.bundles`。仓库里带了构建产物（`lib/`），消费方安装无需构建。

安装后**重启 web**，浏览器**硬刷新**（Cmd+Shift+R）——旧 tab 不会加载新 bundle。

### 升级

```sh
dsh plugin --profile web update github:bill9109/dsh-conversation-share
```

本地路径安装则对替换后的 checkout 重新执行 `add`，然后重启 web 并硬刷新。

### 卸载

```sh
dsh plugin --profile web remove @bill9109/dsh-conversation-share
```

命令内部 = 在 profile 目录执行 `pnpm remove <pkg>` + 自动把它从 `dsh.profile.bundles` 移除。卸载后**重启 web** 并**硬刷新**浏览器。

## 故障排查

| 症状 | 解决 |
| --- | --- |
| 分享胶囊没出现 | 插件要重启 web + 硬刷新后才加载；用 `dsh --profile web --dump-config | grep conversation-share` 确认 bundle 行在 profile 里 |
| 把手不能交叉或吸附异常 | 这是设计使然——开始端吸顶边、结束端吸底边、不可交叉；拖过元素可切换吸附的是哪条边 |
| 拖动时页面滚动 | 只有指针进入上下 64px 边缘区才滚动；在视口内拖动是 1:1 跟手不滚屏 |
| 确认没反应 / 图片空白 | 确认选区至少覆盖一条消息；超长内容分块拼接需要一点时间 |
| 复制图片剪贴板里没有 | 浏览器可能禁止了剪贴板图片写入；改用**下载 PNG** |

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
│   │   └── dom.ts / theme.ts / icons.ts / toast.ts
│   └── vendor/html-to-image/ # 内嵌的 html-to-image 1.11.13（MIT，见其 LICENSE）
├── scripts/build.mjs         # 构建脚本（链接 DSH checkout 依赖 → tsc → tsdown）
├── lib/                      # 构建产物（client.js 为浏览器 bundle，随仓库提交）
├── package.json              # dsh.bundle + dsh.client 声明
├── cordis.patch.yml          # bundle patch（插入 conversation-share 插件）
└── tsconfig.json / tsdown.config.mjs
```

## 构建

需要一份 DSH checkout（官方仓库或快照目录均可）：

```sh
DSH_CHECKOUT=/path/to/dsh-checkout node scripts/build.mjs
# 或通过 pnpm：
DSH_CHECKOUT=/path/to/dsh-checkout pnpm run build
```

脚本会临时把 DSH checkout 的 `node_modules` 软链到本目录（构建结束自动清理），依次执行 `tsc`（类型检查）和 `tsdown`（产出 `lib/index.js` + `lib/client.js`）。

## 开发与验证

```sh
pnpm run check     # tsc --noEmit
DSH_CHECKOUT=/path/to/dsh-checkout pnpm run build   # -> lib/（已提交）
```

`lib/` 已提交，消费方安装无需构建。改动分享流程（把手、吸附、截图、预览）时应在真实 web profile 里验证，并把构建产物随同一改动提交。

## 发布

1. 确保构建产物是最新的：

   ```sh
   DSH_CHECKOUT=/path/to/dsh-checkout node scripts/build.mjs
   ```

2. 升版本号、更新 `CHANGELOG.md`、提交推送 `main` 并打 tag：

   ```sh
   git add . && git commit -m "release v0.1.x" && git push origin main
   git tag v0.1.x && git push origin v0.1.x
   ```

## 社区与关于

- 可复现的 bug、聚焦的功能请求和使用问题，走 [GitHub Issues](https://github.com/bill9109/dsh-conversation-share/issues)。
- 提变更前先读 [CONTRIBUTING.md](CONTRIBUTING.md)；安全问题通过 [SECURITY.md](SECURITY.md) 私有上报。
- 版本与兼容性说明见 [CHANGELOG.md](CHANGELOG.md)。

## License

BSD-3-Clause（vendored html-to-image 为 MIT，见 `src/vendor/html-to-image/LICENSE`）。
