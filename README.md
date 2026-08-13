# dsh-conversation-share — DSH 对话分享截图插件

把 DeepSeek Harness 对话流中选中的一段，渲染成带品牌尾部的 PNG 长图分享出去。

<img width="1512" height="745" alt="image" src="https://github.com/user-attachments/assets/8f7928d4-f6a0-493f-88de-a5d844b9d38c" />
<img width="1512" height="746" alt="image" src="https://github.com/user-attachments/assets/8d48eacf-b417-4056-bc0f-668d9161141b" />



## 功能

- 右上角 Session log 按钮左侧的分享胶囊（与 log 同款样式，点击后激活为蓝色高亮，`[取消][确认]` 在分享左侧展开）
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

用标准的 `dsh plugin` 命令安装到 profile（无需改源码、无需手动编辑 package.json）：

```sh
# 从仓库安装
dsh plugin --profile web add github:dsh-external/dsh-conversation-share

# 或指定分支/提交
dsh plugin --profile web add github:dsh-external/dsh-conversation-share#main

# 或从本地 checkout 安装（开发调试，改完重新构建即生效）
dsh plugin --profile web add /path/to/your/dsh-conversation-share
# 在插件目录内可直接：dsh plugin --profile web add .
```

命令内部 = 在 profile 目录执行 `pnpm add <spec>` + 自动把声明了 `dsh.bundle` 的包追加进 `dsh.profile.bundles`。

安装后**重启 web**，浏览器**硬刷新**（Cmd+Shift+R）——旧 tab 不会加载新 bundle。


## 卸载

```sh
dsh plugin --profile web remove @dsh-external/dsh-conversation-share
```

命令内部 = 在 profile 目录执行 `pnpm remove <pkg>` + 自动把它从 `dsh.profile.bundles` 移除。卸载后**重启 web** 并**硬刷新**浏览器。


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

## License

BSD-3-Clause（vendored html-to-image 为 MIT，见 `src/vendor/html-to-image/LICENSE`）。
