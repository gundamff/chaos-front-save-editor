# Formation DnD + Detail Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Drag-drop formation editing plus a full detail sidebar fed by expanded game-data extraction.

**Architecture:** Extend `extract-game-data.mjs` (`--json-only`) to enrich `game-data.json`; type it in `gameData.ts`; rewrite `FormationTab.vue` with HTML5 DnD and a detail pane.

**Tech Stack:** Node extract script, Vue 3, Element Plus, existing SaveData deploy APIs.

### Task 1: Extract extended tables

- Add `--json-only` (skip AssetRipper/images)
- Parse Skill/Talent/Ability/Weapon + extended UnitType/Character/Item fields
- Run against `F:\SteamLibrary\steamapps\common\Chaos Front\Chaos Front_Data`

### Task 2: Type gameData helpers

- Extend interfaces; add `skillById` / `talentById` / `abilityById` / `weaponById`
- Fix/adjust `tests/gameData.spec.ts` if needed

### Task 3: FormationTab DnD + detail UI + i18n

- DnD bench↔grid; click = select; sidebar full stats
- Update formation hint strings (zh/en)

### Task 4: Verify

- `npm test` && `npm run typecheck`
