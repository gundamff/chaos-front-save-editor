# Changelog

[中文](CHANGELOG.md) | **English**

## [Unreleased]

### Infrastructure

- GitHub Actions: `CI` (tests on push/PR) and `Release` (build and publish on `v*` tags)

### Docs

- English `README.en.md`, `CHANGELOG.en.md`, and `docs/RELEASE.en.md`

## [1.1.0] - 2026-09-08

### Added

- **Formation** tab: 4×6 grid deploy / undeploy / swap, and assign pilots (one pilot cannot crew two units)
- **Planets** tab: edit economy / industry / defense / stability and owning faction; ownership syncs `FactionData.planets`
- Resource tab medals / relationships use real faction names (`FactionData` → army names)
- README screenshots (saves / resources / units / pilots / unlock / collection)

### Docs

- Stronger disclaimer: unofficial, copyright, offline-only, use at own risk, takedown cooperation

## [1.0.0] - 2026-09-07

First portable release.

### Fixed

- **Black screen on load**: serialize integer dictionary keys as bare numbers (e.g. `11:`) for ES3/LitJson; quoted keys from `JSON.stringify` caused `ES3JSONReader.Read_int` FormatException
- Auto-backup current file before restore; clearer errors on load/restore failure

### Added

- Manual **delete** for individual backups (confirm dialog)
- Save slots, resources / units / pilots / unlock-all / collection editing
- Write path: backup (keep last 10 per prefix) → temp file → atomic replace
- Loose JSON parse for LitJson unquoted int keys (`parseJsonLoose`)
- Windows x64 portable packaging (`npm run dist`)

### Notes

- Quit the game before editing; rely on automatic backups or your own copies
- Unofficial third-party tool for legitimate offline play only; see [README disclaimer](README.en.md#disclaimer)
