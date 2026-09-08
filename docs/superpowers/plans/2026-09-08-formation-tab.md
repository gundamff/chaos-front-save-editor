# Formation Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or implement task-by-task.

**Goal:** 独立「编队」Tab：网格站位 + 驾驶员分配。

**Architecture:** SaveData 编队原语 + FormationTab 网格 UI；序列化仍走 stringifyEs3。

**Tech Stack:** Vue 3, Element Plus, Vitest

---

### Task 1: SaveData 编队 API（TDD）

- [ ] 测试：deploy / undeploy / swap / setUnitPilot 冲突
- [ ] 实现 FORMATION_ROWS/COLS 与方法

### Task 2: FormationTab

- [ ] 新建 FormationTab.vue，接入 App.vue（机体与驾驶员之间）
- [ ] 去掉 UnitsTab 编队列与提示

### Task 3: 文档与验证

- [ ] README / CHANGELOG
- [ ] npm test && typecheck
