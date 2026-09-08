# Planets / Formations / Faction Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** README 截图 + 勋章/关系真名 + 星球编辑（同步 FactionData）+ 编队坐标只读展示。

**Architecture:** 扩展 `gameData`（armies 已有、补 planets 名）；`SaveData` 增加 Planet/Faction 访问与归属同步；资源 Tab 用势力名；新建 `PlanetsTab`；机体 Tab 增加编队列。

**Tech Stack:** Vue 3 + Element Plus + Vitest + 现有 ES3/saveModel

## Global Constraints

- 序列化必须继续走 `stringifyEs3`（裸数字键）  
- 改 Planet.faction 必须同步 FactionData.planets  
- 编队 `number` 本阶段只读  
- 中文 UI；不新增无关重构

---

### Task 1: README 截图

- [ ] 在 README「功能」后增加「界面预览」，嵌入 6 张 `docs/QQ_*.png`  
- [ ] 推送前本地预览 markdown 路径正确（相对仓库根）

### Task 2: 抽取星球名并导出 armies

- [ ] 从 `resources.assets` LanguageData 解析 nameId 358–374 → `planets: {id,name}[]` 写入 game-data.json  
- [ ] `gameData.ts` 导出 `armies` / `planets` 与查找函数  
- [ ] 测试：`armyById` / `planetById` 能解析已知 id

### Task 3: 勋章/关系真名

- [ ] SaveData 提供 `factionLabel(i)`（FactionData id=i+1 → army 名，缺省回退 `势力${i+1}`）  
- [ ] ResourcesTab 标签改用真名  
- [ ] 单测：给定 FactionData 样例，标签正确

### Task 4: 星球编辑

- [ ] 测试先行：`setPlanetFaction` 从 A 改到 B 时，A.planets 去掉、B.planets 加入且去重  
- [ ] SaveData：读写 PlanetData 数值字段 + setPlanetFaction  
- [ ] PlanetsTab + App.vue 注册 Tab  
- [ ] 警示：改归属会影响势力控制范围

### Task 5: 编队只读

- [ ] UnitsTab 增加「编队」列：`[0,0]` 显示「—」，否则 `n[0],n[1]`  
- [ ] 表头旁短提示：本版本仅查看

### Task 6: 验证

- [ ] `npm test`  
- [ ] `npm run typecheck`（若耗时可只跑相关）
