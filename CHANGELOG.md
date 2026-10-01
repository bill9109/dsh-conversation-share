# Changelog

All notable user-facing changes to dsh-conversation-share are documented in this file. The project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic version tags.

## [0.1.6] - 2026-10-01

### Fixed

- The export now lays out exactly like the live conversation. The offscreen capture wrapper is appended to `<body>`, outside the conversation's cascade, so the custom properties the conversation defines (`--dsh-chat-content-width` `--dsh-chat-user-width`, ...) fell back to their CSS defaults and message bubbles sized off the 748px fallback instead of the live column width. Text re-wrapped differently from the screen and rows came out shorter (a 98px row exported as 76px). `capture.ts` now mirrors the flow list's resolved custom properties plus the inherited text properties onto the wrapper before cloning, so wrapping, row heights and the horizontal rhythm match the view: the same row now exports at 98.2px, and other sampled rows match within rounding (24.5→25.2, 41→41.2, 1226→1226.2 CSS px).
- The capture footer shows the full **DeepSeek Harness** lockup again (whale mark + "deepseek" + the HARNESS badge) instead of the bare whale. DSH split the old single 182x24 brand SVG into two parts — `[data-slot="sidebar.brand.mark"]` (whale, viewBox `0 0 23.16 17.04`) and `[data-slot="sidebar.brand.name"]` (wordmark, viewBox `26 0 156 24`) — and the footer used to keep only the button's first SVG. Both parts are crops of the same artwork, so `brand.ts` now re-assembles them into one 182x24 lockup. The wordmark is also cached because the collapsed sidebar unmounts its slot; a capture taken with the sidebar collapsed still renders the complete lockup.
- The header share pill no longer mounts into the header's **更多操作 (More actions)** overflow menu. DSH moved the old `Session 日志` button into that menu, and the popup renders inside `<header>`, so the label-based locator matched the `下载 Session 日志` menu item and injected the share control into the popup — it only showed while the menu was open and vanished (and could not be clicked reliably) once it closed.
- `findHeaderUtilities()` now prefers the stable `[data-slot="conversation.session.header.utilities"]` strip and rejects any popup descendant (`[role="menu"]`, `[role="listbox"]`, `[role="dialog"]`, `[data-menu-material]`) as a mount point.
- The Session-log border hand-off also ignores menu items, so the share pill keeps its own hairline border when the log button lives in the overflow menu.

### Note

- `lib/` is committed and the release workflow (`npm publish`) does not rebuild it. 0.1.5 shipped a `lib/` built before the `data-slot` locator landed in `src/`, which is why the installed build still used the label locator. This release rebuilds `lib/` from the current `src/`.

## [0.1.5] - 2026-08-31

### Added

- Hot-install helper `scripts/install-hot.mjs` and README docs: load a plugin into a running `dsh web` without a restart by registering it in the profile's hot-reloaded user patch layer (`cordis.patch.yml`) instead of `dsh.profile.bundles`.

## [0.1.4] - 2026-08-31

### Changed

- The header share button now gets a hover fill, matching the Session log button for visual consistency.
- The share-mode confirm/cancel buttons gain hover fills.
- The share button is located with a localized Session-log label, so it stays findable in non-English UI.

### Release notes

- First release published to npm under the bare package name `dsh-conversation-share` (registry `latest`). The earlier scoped names were git-only and were never published to npm.

## [0.1.3] - 2026-08-26

### Changed

- Publish pipeline verification via GitHub Actions + npm Trusted Publishing (OIDC). The package is now published under the bare scope `dsh-conversation-share`.

## [0.1.2] - 2026-08-14

### Changed

- Migrated the repository to the `omdsh-dev` GitHub organization: the package scope is now `@omdsh-dev/dsh-conversation-share`, and the repository, homepage, bugs, badges, and install/update/remove commands all point at `github.com/omdsh-dev/dsh-conversation-share`. The built `lib/` was re-registered under the new name.

## [0.1.1] - 2026-08-14

### Changed

- Repositioned the README in the shared bilingual convention: `README.md` (English) is now the main file, `README.zh.md` carries the Chinese side, and `README.i18n.yaml` records their git blob hashes with a `scripts/verify-i18n.mjs` consistency check.
- Added versioned static badges, a one-line install command, a Usage section, a Troubleshooting table, and Development/Release sections.
- Expanded `package.json` metadata: English description, `keywords`, `engines`, the `./cordis.patch.yml` export, and README files in `files`.
- Added `CHANGELOG.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md`.

## [0.1.0] - 2026-08-13

### Added

- Initial release: select a range of a DSH conversation with two draggable, magnetically snapping markers and render it into a PNG long image with a branded footer.
- Renamed the package scope `@dsh-external` → `@bill9109`; the built `lib/` was rebuilt with the new registration name.

