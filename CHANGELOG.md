# Changelog

All notable user-facing changes to dsh-conversation-share are documented in this file. The project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic version tags.

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

