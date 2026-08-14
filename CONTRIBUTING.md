# Contributing to dsh-conversation-share

Focused fixes, tests, and documentation changes are welcome. By participating, you agree to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Before you start

1. Read [README.md](README.md) — features, usage, and troubleshooting.
2. Search existing [issues](https://github.com/bill9109/dsh-conversation-share/issues) and pull requests before opening duplicate work.
3. Open an issue before changing the share flow (markers, snapping, capture pipeline, preview modal) or the bundle manifest.
4. Keep each change narrowly scoped. Do not mix a feature or fix with unrelated refactoring or generated-output churn.

## Architecture and scope

dsh-conversation-share is an out-of-tree DeepSeek Harness Web client plugin. Contributions must preserve these responsibilities:

- The plugin is a standard DSH **bundle** with a no-op host half and a browser half (`dsh.client` declaration + `exports["./client"]`) that does the sharing work.
- Range selection uses two non-crossing markers: the start handle snaps to top edges, the end handle to bottom edges.
- Extra-long content is chunked and stitched to bypass the canvas height limit; the branded footer stays at the bottom.
- The vendored `html-to-image` snapshot is MIT-licensed; keep its LICENSE and do not edit it as an untracked fork.

## Development

```sh
pnpm run check     # tsc --noEmit
DSH_CHECKOUT=/path/to/dsh-checkout pnpm run build   # -> lib/ (committed)
```

Keep the bilingual README in sync (edit both `README.md` and `README.zh.md`, then `node scripts/verify-i18n.mjs --write`).

## Commit and release

- Bump the version and update `CHANGELOG.md` (Keep a Changelog format) in the same change that ships a user-visible difference.
- Commit the rebuilt `lib/` with the source change so consumers install without building.
- Tag releases with a semantic version (`v0.1.1`) and push tags with the release.
