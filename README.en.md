# dsh-conversation-share — Share a range of a DSH conversation as an image

[English](README.en.md) | [中文](README.md)

Render a selected range of a DeepSeek Harness conversation into a PNG long image with a branded footer, ready to share.

License BSD-3-Clause · [GitHub](https://github.com/bill9109/dsh-conversation-share)

<img width="1512" height="745" alt="image" src="https://github.com/user-attachments/assets/8f7928d4-f6a0-493f-88de-a5d844b9d38c" />
<img width="1512" height="746" alt="image" src="https://github.com/user-attachments/assets/8d48eacf-b417-4056-bc0f-668d9161141b" />

## Features

- Share capsule to the left of the Session log button in the top-right corner (same style as log; clicking activates a blue highlight, with `[Cancel][Confirm]` expanding to its left)
- Two draggable range markers (horizontal labels: "Start here" / "End here") with magnetic snapping
  - Snap points = semantic message rows + markdown blocks (p/pre/ul/li/table/headings) + visual boxes (code blocks/cards) + content-level buttons (artifact file chips) + every text line inside paragraphs
  - The start handle snaps to an element’s **top edge**, the end handle to its **bottom edge**; the two handles cannot cross
  - Snap hint = light blue translucent rounded-rect fill (flat style)
- Scrolling model: handles follow the pointer 1:1 within the viewport without scrolling; only when the pointer enters the top/bottom edge zones (64px) does the page scroll (clamped penetration depth, frame-rate independent), stopping when it leaves; clicking does not scroll (a real drag of ≥8px is required)
- Capture: 40pt theme-background padding (symmetric on all sides) + a DeepSeek Harness brand icon at the bottom (with the BETA badge text); extra-long content is rendered in chunks and stitched together to bypass the canvas height limit
- Preview modal: image width adapts, vertical scroll to review, download PNG, copy image

## Directory structure

```
dsh-conversation-share/
├── src/
│   ├── index.ts              # host half of the plugin (no-op)
│   ├── client/               # browser half (client bundle entry src/client/index.ts)
│   │   ├── index.ts          # apply(ctx): mounts the share flow
│   │   ├── controller.ts     # share button / cancel-confirm / mode switching / capture orchestration
│   │   ├── markers.ts        # range marker handles (snapping, scrolling, state machine)
│   │   ├── snap-targets.ts   # snap-target collection (rows/blocks/line-level text/content buttons + position dedup)
│   │   ├── capture.ts        # capture pipeline (chunking, cropping, stitching, branded footer)
│   │   ├── brand.ts          # brand SVG clone (var() baking + clip-path neutralization)
│   │   ├── modal.ts          # preview modal + download/copy
│   │   └── dom.ts / theme.ts / icons.ts / toast.ts
│   └── vendor/html-to-image/ # vendored html-to-image 1.11.13 (MIT, see its LICENSE)
├── scripts/build.mjs         # build script (links DSH checkout deps → tsc → tsdown)
├── lib/                      # build output (client.js is the browser bundle, committed)
├── package.json              # dsh.bundle + dsh.client declarations
├── cordis.patch.yml          # bundle patch (inserts the conversation-share plugin)
└── tsconfig.json / tsdown.config.mjs
```

## Build

Requires a DSH checkout (the official repository or a snapshot directory both work):

```sh
DSH_CHECKOUT=/path/to/dsh-checkout node scripts/build.mjs
# or via pnpm:
DSH_CHECKOUT=/path/to/dsh-checkout pnpm run build
```

The script temporarily symlinks the DSH checkout’s `node_modules` into this directory (cleaned up automatically when the build ends) and runs `tsc` (type check) then `tsdown` (producing `lib/index.js` + `lib/client.js`).

## Install

Install into a profile with the standard `dsh plugin` command (no source changes, no manual package.json edits):

```sh
# From the repository
dsh plugin --profile web add github:bill9109/dsh-conversation-share

# Or pin a branch/commit
dsh plugin --profile web add github:bill9109/dsh-conversation-share#main

# Or install from a local checkout (development — rebuild and it takes effect)
dsh plugin --profile web add /path/to/your/dsh-conversation-share
# Inside the plugin directory you can simply run: dsh plugin --profile web add .
```

Internally the command runs `pnpm add <spec>` in the profile directory and automatically appends packages that declare `dsh.bundle` to `dsh.profile.bundles`.

After installing, **restart web** and **hard-refresh** the browser (Cmd+Shift+R) — old tabs do not load the new bundle.

## Uninstall

```sh
dsh plugin --profile web remove @dsh-external/dsh-conversation-share
```

Internally the command runs `pnpm remove <pkg>` in the profile directory and removes it from `dsh.profile.bundles`. After uninstalling, **restart web** and **hard-refresh** the browser.

## Release

1. Make sure the build output is up to date:

   ```sh
   DSH_CHECKOUT=/path/to/dsh-checkout node scripts/build.mjs
   ```

2. Commit and push to `main` (`lib/` is committed as prebuilt output so consumers need no DSH checkout):

   ```sh
   git add .
   git commit -m "release v0.1.x"
   git push origin main
   ```

## License

BSD-3-Clause (the vendored html-to-image is MIT, see `src/vendor/html-to-image/LICENSE`).
