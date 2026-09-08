# About Dialog Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Header About button opens a localized dialog with version + GitHub + disclaimer; then release as v1.3.0.

**Architecture:** Thin IPC (`getVersion`, `openExternal` allowlisted) + `App.vue` dialog + i18n keys.

**Tech Stack:** Electron, Vue 3, Element Plus, existing i18n.

### Task 1: IPC + preload

- Add `getAppVersion()` and `openExternal(url)` to `SaveEditorApi`
- Main: handlers; allow only the GitHub repo HTTPS URL
- Preload: expose both

### Task 2: UI + i18n

- `App.vue`: About button, dialog, open GitHub on click
- `zh.ts` / `en.ts`: about.* keys

### Task 3: Docs + release

- CHANGELOG Unreleased → 1.3.0; bump package version
- `npm test` + `npm run typecheck`
- Commit, push, tag `v1.3.0`, watch Release
