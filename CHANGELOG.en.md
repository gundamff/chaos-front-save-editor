# Changelog

[中文](CHANGELOG.md) | **English**

## [Unreleased]

## [1.4.0] - 2026-09-08

### Added

- **Formation** drag-and-drop deploy/swap/undeploy; detail pane shows unit stats, weapons/abilities, gear, and pilot attributes/skills/talents (from extracted game tables)
- **Formation** UI restyled as a card layout (unit/pilot dual portraits + large detail art) in the same light theme as other tabs
- Bench split into undeployed units / free pilots with drag-assign; click unit vs pilot for separate details
- Equip/unequip carried items in formation detail (ships 4 slots / mechs 2 slots; syncs `PlayerItems`)
- Deploy without a pilot first, then assign on the grid (still validated on save); header and Saves tab show the slot being edited

## [1.3.0] - 2026-09-08

### Added

- Header **About** dialog: version, GitHub repository link, unofficial disclaimer

## [1.2.0] - 2026-09-08

### Added

- In-app Chinese / English UI (follows system locale by default; switch in the header)

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
