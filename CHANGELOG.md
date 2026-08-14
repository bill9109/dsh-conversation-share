# Changelog

All notable user-facing changes to dsh-conversation-share are documented in this file. The project follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and uses semantic version tags.

## [Unreleased]

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
