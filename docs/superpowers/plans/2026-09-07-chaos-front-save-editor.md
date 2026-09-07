# Chaos Front 存档修改器 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 图形化（Electron + Vue3 + TS）的《Chaos Front》存档修改器：机体/驾驶员等级、资源、全机型解锁、图鉴解锁，含备份还原，打包 portable exe 分发。

**Architecture:** Electron 三进程标准结构。纯 TS 数据层（`src/common`）负责 ES3 JSON 解析/修改/序列化，主进程负责文件 IO 与备份，渲染层 Vue3 + Element Plus 六 Tab UI。游戏数据（机型表/等级表/名字/图标）由一次性提取脚本生成入库。

**Tech Stack:** electron-vite (vue-ts 模板)、Vue3、Pinia、Element Plus、TypeScript、Vitest、electron-builder、pngjs（仅提取脚本用）。

**Spec:** `docs/superpowers/specs/2026-09-07-chaos-front-save-editor-design.md`

## Global Constraints

- Node ≥ 20；包管理 npm；TypeScript `strict` 开启（模板默认）
- UI 全中文；Element Plus 使用 zh-cn locale
- 渲染进程 `contextIsolation: true`、`nodeIntegration: false`、`sandbox: true`（模板默认）
- 所有写文件操作：先备份（`backup/` 子目录，保留最近 10 份）→ 写临时文件 → 原子替换；解析失败一律拒绝写入
- ES3 文档所有未知字段原样保留；写入 UTF-8（无 BOM）
- 仓库不提交真实玩家存档（测试夹具用合成数据）
- 游戏素材（图标/头像/名字表）版权归 ChaosGalaxyStudio，README 必须声明仅供已购玩家本地使用
- 提取脚本产物提交入库：`src/common/data/game-data.json` + `src/renderer/src/assets/game/*.png`，应用离线可用

---

### Task 1: 项目脚手架

**Files:**
- Create: 项目根全套（electron-vite vue-ts 模板生成）
- Modify: `package.json`（依赖）、`electron.vite.config.ts`

**Interfaces:**
- Produces: 可运行的空应用 + `npm run dev` / `npm run build` 脚本；后续任务在此结构上添加文件

- [ ] **Step 1: 用 electron-vite 模板初始化**

仓库已存在（含 docs/），先脚手架到临时目录再合并：

```bash
cd D:\eclipse\git
npm create @quick-start/electron@latest cfse-tmp -- --template vue-ts --skip
# 将 cfse-tmp 内容（除 .git）拷入 chaos-front-save-editor，然后删除 cfse-tmp
robocopy cfse-tmp chaos-front-save-editor /E /XD .git /NFL /NDL /NJH /NJS
rmdir /s /q cfse-tmp
```

若 `--skip` 不被支持，交互提示全部选默认（不加任何 addon/插件）。

- [ ] **Step 2: 安装依赖**

```bash
cd D:\eclipse\git\chaos-front-save-editor
npm install
npm install element-plus @element-plus/icons-vue pinia
npm install -D vitest pngjs
```

- [ ] **Step 3: 配置 Vitest**

创建 `vitest.config.ts`：

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node'
  }
})
```

`package.json` scripts 增加：

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: 验证构建通过**

Run: `npm run build`
Expected: 类型检查 + 构建成功（模板默认页）

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: electron-vite vue-ts 脚手架 + Element Plus/Pinia/Vitest"
```

---

### Task 2: 等级常量与换算 `level.ts`

**Files:**
- Create: `src/common/level.ts`
- Test: `tests/level.spec.ts`

**Interfaces:**
- Produces: `CHARACTER_LEVEL_TABLE`、`CHARACTER_MAX_EXP=20000`、`UNIT_MAX_LEVEL=6`、`UNIT_EXP6_FALLBACK=11970`、`characterLevelForExp(exp)`、`characterExpForLevel(level)`、`unitLevelForExp(exp, table)`

- [ ] **Step 1: 写失败测试**

`tests/level.spec.ts`：

```ts
import { describe, expect, it } from 'vitest'
import {
  CHARACTER_LEVEL_TABLE,
  CHARACTER_MAX_EXP,
  UNIT_EXP6_FALLBACK,
  UNIT_MAX_LEVEL,
  characterExpForLevel,
  characterLevelForExp,
  unitLevelForExp
} from '../src/common/level'

describe('character levels', () => {
  it('has the exact in-game table', () => {
    expect(CHARACTER_LEVEL_TABLE).toEqual([0, 300, 1050, 2300, 3800, 5800, 8000, 11000, 15000, 20000])
    expect(CHARACTER_MAX_EXP).toBe(20000)
  })

  it('computes level from exp', () => {
    expect(characterLevelForExp(0)).toBe(1)
    expect(characterLevelForExp(299)).toBe(1)
    expect(characterLevelForExp(300)).toBe(2)
    expect(characterLevelForExp(19999)).toBe(9)
    expect(characterLevelForExp(20000)).toBe(10)
    expect(characterLevelForExp(999999)).toBe(10)
  })

  it('computes exp for level', () => {
    expect(characterExpForLevel(1)).toBe(0)
    expect(characterExpForLevel(10)).toBe(20000)
  })
})

describe('unit levels', () => {
  it('computes level 0..6 from table', () => {
    const table = [0, 900, 2100, 3590, 5390, 8380, 11970]
    expect(unitLevelForExp(0, table)).toBe(0)
    expect(unitLevelForExp(900, table)).toBe(1)
    expect(unitLevelForExp(8389, table)).toBe(6)
    expect(unitLevelForExp(999999, table)).toBe(6)
    expect(UNIT_MAX_LEVEL).toBe(6)
    expect(UNIT_EXP6_FALLBACK).toBe(11970)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test`
Expected: FAIL（模块不存在）

- [ ] **Step 3: 实现**

`src/common/level.ts`：

```ts
/** 驾驶员等级表（Informations.characterLevelTable，反编译验证） */
export const CHARACTER_LEVEL_TABLE: readonly number[] = [0, 300, 1050, 2300, 3800, 5800, 8000, 11000, 15000, 20000]

/** 驾驶员最高等级 */
export const CHARACTER_MAX_LEVEL = 10

/** 驾驶员满级经验 */
export const CHARACTER_MAX_EXP = CHARACTER_LEVEL_TABLE[CHARACTER_LEVEL_TABLE.length - 1]

/** 机体最高等级（+0 ~ +6） */
export const UNIT_MAX_LEVEL = 6

/** 所有 12 张机体等级表中 EXP6 的最大值，≥ 此值必为 +6 */
export const UNIT_EXP6_FALLBACK = 11970

/** 驾驶员 exp → 等级（1..10） */
export function characterLevelForExp(exp: number): number {
  let level = 1
  for (let i = 0; i < CHARACTER_LEVEL_TABLE.length; i++) {
    if (exp >= CHARACTER_LEVEL_TABLE[i]) level = i + 1
  }
  return level
}

/** 驾驶员等级(1..10) → 门槛 exp */
export function characterExpForLevel(level: number): number {
  if (level <= 1) return 0
  return CHARACTER_LEVEL_TABLE[Math.min(level, CHARACTER_LEVEL_TABLE.length) - 1]
}

/** 机体 exp → 等级（0..6），table 为该机型 levelType 对应的 7 档经验 */
export function unitLevelForExp(exp: number, table: number[]): number {
  for (let lv = UNIT_MAX_LEVEL; lv >= 0; lv--) {
    if (exp >= table[lv]) return lv
  }
  return 0
}
```

- [ ] **Step 4: 测试通过**

Run: `npm test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/common/level.ts tests/level.spec.ts vitest.config.ts package.json
git commit -m "feat: 等级常量与 exp<->level 换算"
```

---

### Task 3: ES3 解析/序列化 `es3.ts`

**Files:**
- Create: `src/common/es3.ts`
- Test: `tests/es3.spec.ts`

**Interfaces:**
- Produces: `Es3Field { __type?: string; value: unknown }`、`Es3Doc = Record<string, Es3Field>`、`parseEs3(text)`、`stringifyEs3(doc)`、`isWrapped(v)`、`getField(doc,key)`、`setField(doc,key,value)`

- [ ] **Step 1: 写失败测试**

`tests/es3.spec.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { getField, isWrapped, parseEs3, setField, stringifyEs3, type Es3Doc } from '../src/common/es3'

const SAMPLE = JSON.stringify({
  PlayerCredit: { __type: 'int', value: 9788541 },
  PlayerUnits: {
    __type: 'System.Collections.Generic.List`1[[Unit, Assembly-CSharp]],mscorlib',
    value: [{ unitType: 5, armyId: 12, characterId: 0, items: [], custom: 0, number: [0, 0], exp: 7498, playerName: '' }]
  },
  PlayerMedals: { __type: 'System.Int32[],mscorlib', value: [0, 0, 0, 7200] },
  HistoryTime: { __type: 'string', value: '委员会历28年2月24日' }
})

describe('es3', () => {
  it('parses wrapped fields', () => {
    const doc = parseEs3(SAMPLE)
    expect(doc.PlayerCredit.value).toBe(9788541)
    expect(doc.PlayerCredit.__type).toBe('int')
    expect(doc.PlayerUnits.value).toHaveLength(1)
    expect(doc.HistoryTime.value).toContain('委员会历')
  })

  it('round-trips losslessly', () => {
    const a = parseEs3(SAMPLE)
    const b = parseEs3(stringifyEs3(a))
    expect(b).toEqual(a)
  })

  it('tolerates unwrapped top-level values', () => {
    const doc = parseEs3('{"Foo": 1}')
    expect(doc.Foo.value).toBe(1)
    expect(isWrapped(doc.Foo)).toBe(false)
  })

  it('setField mutates and keeps __type', () => {
    const doc: Es3Doc = parseEs3(SAMPLE)
    setField(doc, 'PlayerCredit', 123)
    expect(doc.PlayerCredit.value).toBe(123)
    expect(doc.PlayerCredit.__type).toBe('int')
    expect(getField<number>(doc, 'PlayerCredit')).toBe(123)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- es3`
Expected: FAIL

- [ ] **Step 3: 实现**

`src/common/es3.ts`：

```ts
export interface Es3Field {
  __type?: string
  value: unknown
}

export type Es3Doc = Record<string, Es3Field>

export function isWrapped(v: unknown): v is Es3Field {
  return typeof v === 'object' && v !== null && 'value' in v
}

/** 解析 ES3 JSON；顶层未包装的值也兼容 */
export function parseEs3(text: string): Es3Doc {
  const raw = JSON.parse(text) as Record<string, unknown>
  const doc: Es3Doc = {}
  for (const [k, v] of Object.entries(raw)) {
    doc[k] = isWrapped(v) ? v : { value: v }
  }
  return doc
}

/** 序列化：与游戏 ES3/LitJson 兼容（解析器不关心排版），UTF-8 无 BOM */
export function stringifyEs3(doc: Es3Doc): string {
  return JSON.stringify(doc, null, 2) + '\n'
}

export function getField<T>(doc: Es3Doc, key: string): T {
  const f = doc[key]
  if (!f) throw new Error(`ES3 字段缺失: ${key}`)
  return f.value as T
}

/** 只改 value，保留 __type */
export function setField(doc: Es3Doc, key: string, value: unknown): void {
  const f = doc[key]
  if (!f) throw new Error(`ES3 字段缺失: ${key}`)
  f.value = value
}
```

- [ ] **Step 4: 测试通过**

Run: `npm test -- es3`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/common/es3.ts tests/es3.spec.ts
git commit -m "feat: ES3 JSON 解析/序列化"
```

---

### Task 4: 存档模型 `saveModel.ts`

**Files:**
- Create: `src/common/gameData.ts`、`src/common/saveModel.ts`
- Test: `tests/saveModel.spec.ts`
- Test fixture: `tests/fixtures/minimal-save.json`（合成数据，非真实存档）

**Interfaces:**
- Consumes: `es3.ts`（parseEs3/stringifyEs3/setField）、`level.ts`
- Produces（后续 main/renderer 全部依赖）:

```ts
// gameData.ts
export interface UnitTypeEntry { id: number; name: string; kind: number; size: number; levelType: number; model: number }
export interface CharacterEntry { id: number; name: string; portrait: number }
export interface ItemEntry { id: number; name: string; icon: number }
export interface GameData {
  unitTypes: UnitTypeEntry[]
  characters: CharacterEntry[]
  items: ItemEntry[]
  levelTables: Record<string, number[]>
  unitMaxExp: Record<string, number>
}
export const ALL_UNIT_TYPE_IDS: number[]  // 1..92
export function unitTypeById(gd: GameData, id: number): UnitTypeEntry | undefined
export function characterById(gd: GameData, id: number): CharacterEntry | undefined
export function itemById(gd: GameData, id: number): ItemEntry | undefined
export function levelTableOf(gd: GameData, levelType: number): number[]
export function unitMaxExpOf(gd: GameData, unitTypeId: number): number  // 无表则 UNIT_EXP6_FALLBACK

// saveModel.ts
export interface UnitEntry {
  unitType: number; armyId: number; characterId: number; items: number[]
  custom: number; number: number[]; exp: number; playerName: string
}
export class SaveSave { /* 见下 */ }
export class SaveData {
  static load(text: string): SaveData            // 解析+快照；字段缺失抛错
  readonly doc: Es3Doc
  get armyId(): number; get armyName(): string; get day(): number; get saveTime(): string
  get credit(): number;    setCredit(v: number): void
  get prestige(): number;  setPrestige(v: number): void
  get star(): number;      setStar(v: number): void
  get medals(): number[];  setMedal(i: number, v: number): void
  get relationships(): number[]; setRelationship(i: number, v: number): void
  get units(): UnitEntry[]
  setUnitExp(index: number, exp: number): void
  maxAllUnits(gd: GameData): number
  removeUnit(index: number): void               // 归还装备到 PlayerItems（模仿游戏 Unit.Remove）
  addUnit(gd: GameData, unitTypeId: number, level: number): UnitEntry
  get characters(): number[]
  get characterExps(): number[]
  setPilotExp(index: number, exp: number): void
  maxAllPilots(): number
  get unlockedUnitTypes(): number[]; setUnlockedUnitTypes(ids: number[]): void
  unlockAllUnitTypes(): void
  get unlockedItems(): number[]; unlockAllItems(gd: GameData): void
  serialize(): string
}
export interface CollectionSnapshot { endings: boolean[]; units: number[]; members: number[] }
export function parseCollection(text: string): CollectionSnapshot
export function serializeCollection(c: CollectionSnapshot): string
export function maxCollection(c: CollectionSnapshot): void  // endings=true, units=7, members=10
```

- [ ] **Step 1: 创建合成夹具**

`tests/fixtures/minimal-save.json`：

```json
{
  "HistoryTime": { "__type": "string", "value": "委员会历28年2月24日" },
  "RealTime": { "__type": "string", "value": "2026/9/7 15:52:02" },
  "PlayerStar": { "__type": "int", "value": 6 },
  "PlayArmyName": { "__type": "string", "value": "焰火团" },
  "PlayerFlag": { "__type": "int", "value": 12 },
  "PlayerLeaderName": { "__type": "string", "value": "红玉" },
  "PlayerDay": { "__type": "int", "value": 9774 },
  "PlayerArmyId": { "__type": "int", "value": 12 },
  "PlayerCredit": { "__type": "int", "value": 9788541 },
  "PlayerPrestige": { "__type": "int", "value": 1815 },
  "PlayerMedals": { "__type": "System.Int32[],mscorlib", "value": [0, 0, 0, 7200] },
  "PlayerRelationships": { "__type": "System.Int32[],mscorlib", "value": [300, 50, 300, 999] },
  "PlayerCharacters": { "__type": "System.Collections.Generic.List`1[[System.Int32]],mscorlib", "value": [84, 87, 83] },
  "PlayerCharacterEXPs": { "__type": "System.Collections.Generic.List`1[[System.Int32]],mscorlib", "value": [12241, 17409, 8990] },
  "PlayerUnlockedUnitTypes": { "__type": "System.Collections.Generic.List`1[[System.Int32]],mscorlib", "value": [1, 2, 35] },
  "PlayerUnlockedItems": { "__type": "System.Collections.Generic.List`1[[System.Int32]],mscorlib", "value": [1, 2] },
  "PlayerItems": { "__type": "System.Int32[],mscorlib", "value": [5, 11, 0, 0, 5, 10, 5, 10, 0, 0, 0, 0, 0, 10, 0, 0] },
  "PlayerUnits": {
    "__type": "System.Collections.Generic.List`1[[Unit, Assembly-CSharp]],mscorlib",
    "value": [
      { "unitType": 5, "armyId": 12, "characterId": 0, "items": [], "custom": 0, "number": [0, 0], "exp": 7498, "playerName": "" },
      { "unitType": 78, "armyId": 12, "characterId": 85, "items": [1, 1], "custom": 85, "number": [1, 2], "exp": 17042, "playerName": "" }
    ]
  }
}
```

- [ ] **Step 2: 写失败测试**

`tests/saveModel.spec.ts`：

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ALL_UNIT_TYPE_IDS, type GameData } from '../src/common/gameData'
import {
  SaveData,
  loadCollectionText,
  maxCollection,
  serializeCollectionText
} from '../src/common/saveModel'

const fixture = () => readFileSync(join(__dirname, 'fixtures/minimal-save.json'), 'utf8')

const gd: GameData = {
  unitTypes: [
    { id: 1, name: '侦察舰', kind: 1, size: 2, levelType: 3, model: 1 },
    { id: 5, name: '云雀', kind: 1, size: 2, levelType: 6, model: 5 },
    { id: 35, name: '剑士I', kind: 2, size: 0, levelType: 1, model: 17 },
    { id: 92, name: '最终机', kind: 2, size: 1, levelType: 7, model: 92 }
  ],
  characters: [
    { id: 84, name: '甲', portrait: 34 },
    { id: 85, name: '乙', portrait: 35 },
    { id: 87, name: '红玉', portrait: 87 }
  ],
  items: [
    { id: 1, name: '修理包', icon: 0 },
    { id: 2, name: '强化件', icon: 1 },
    { id: 3, name: '新装备', icon: 2 }
  ],
  levelTables: {
    '1': [0, 180, 420, 720, 1080, 1680, 2400],
    '3': [0, 240, 560, 960, 1440, 2230, 3190],
    '6': [0, 400, 930, 1600, 2390, 3720, 5320],
    '7': [0, 380, 880, 1500, 2250, 3500, 5000]
  },
  unitMaxExp: { '1': 3190, '5': 5320, '35': 2400, '92': 5000 }
}

describe('SaveData', () => {
  it('loads snapshot fields', () => {
    const s = SaveData.load(fixture())
    expect(s.credit).toBe(9788541)
    expect(s.armyName).toBe('焰火团')
    expect(s.armyId).toBe(12)
    expect(s.units).toHaveLength(2)
    expect(s.units[1].unitType).toBe(78)
    expect(s.characters).toEqual([84, 87, 83])
  })

  it('modifies resources without touching other fields', () => {
    const s = SaveData.load(fixture())
    s.setCredit(1)
    s.setMedal(0, 999)
    s.setRelationship(2, 500)
    const s2 = SaveData.load(s.serialize())
    expect(s2.credit).toBe(1)
    expect(s2.medals[0]).toBe(999)
    expect(s2.relationships[2]).toBe(500)
    expect(s2.armyName).toBe('焰火团')
    expect(s2.units).toHaveLength(2)
  })

  it('maxAllUnits uses per-unit levelType EXP6', () => {
    const s = SaveData.load(fixture())
    const n = s.maxAllUnits(gd)
    expect(n).toBe(2)
    const s2 = SaveData.load(s.serialize())
    expect(s2.units[0].exp).toBe(5320)   // unitType 5 -> levelType 6 表 EXP6
    expect(s2.units[1].exp).toBe(5320)
  })

  it('addUnit places a fresh unit with chosen level', () => {
    const s = SaveData.load(fixture())
    const u = s.addUnit(gd, 92, 6)
    expect(u.armyId).toBe(12)
    expect(u.exp).toBe(5000)
    expect(u.characterId).toBe(0)
    expect(u.items).toEqual([])
    const s2 = SaveData.load(s.serialize())
    expect(s2.units).toHaveLength(3)
    expect(s2.units[2].unitType).toBe(92)
  })

  it('removeUnit returns items to PlayerItems', () => {
    const s = SaveData.load(fixture())
    const before = s.docPlayerItems().slice()
    s.removeUnit(1) // unit 78 持有 items [1,1]
    const s2 = SaveData.load(s.serialize())
    expect(s2.units).toHaveLength(1)
    const after = s2.docPlayerItems()
    expect(after[0]).toBe(before[0] + 2) // 两件 id=1 归还
  })

  it('maxAllPilots sets every pilot exp to 20000', () => {
    const s = SaveData.load(fixture())
    expect(s.maxAllPilots()).toBe(3)
    const s2 = SaveData.load(s.serialize())
    expect(s2.characterExps).toEqual([20000, 20000, 20000])
  })

  it('unlockAllUnitTypes unlocks 1..92 and keeps ids sorted unique', () => {
    const s = SaveData.load(fixture())
    s.unlockAllUnitTypes()
    const s2 = SaveData.load(s.serialize())
    expect(s2.unlockedUnitTypes).toEqual(ALL_UNIT_TYPE_IDS)
  })

  it('unlockAllItems unlocks every item', () => {
    const s = SaveData.load(fixture())
    s.unlockAllItems(gd)
    const s2 = SaveData.load(s.serialize())
    expect(s2.unlockedItems).toEqual([1, 2, 3])
  })

  it('rejects structurally broken saves', () => {
    expect(() => SaveData.load('{"Whatever": {"value": 1}}')).toThrow()
  })
})

describe('collection.cf', () => {
  const text = JSON.stringify({
    Endings: { __type: 'System.Boolean[],mscorlib', value: [true, false, false, false, false, false, false, false] },
    Units: { __type: 'System.Int32[],mscorlib', value: new Array(51).fill(0) },
    Members: { __type: 'System.Int32[],mscorlib', value: new Array(42).fill(0) }
  })

  it('maxes collection', () => {
    const c = loadCollectionText(text)
    maxCollection(c)
    expect(c.endings.every(Boolean)).toBe(true)
    expect(c.units.every((v) => v === 7)).toBe(true)
    expect(c.members.every((v) => v === 10)).toBe(true)
    const back = serializeCollectionText(c)
    expect(JSON.parse(back).Units.value[0]).toBe(7)
  })
})
```

- [ ] **Step 3: 运行确认失败**

Run: `npm test -- saveModel`
Expected: FAIL

- [ ] **Step 4: 实现 gameData.ts**

`src/common/gameData.ts`：

```ts
import data from './data/game-data.json'
import { UNIT_EXP6_FALLBACK } from './level'

export interface UnitTypeEntry { id: number; name: string; kind: number; size: number; levelType: number; model: number }
export interface CharacterEntry { id: number; name: string; portrait: number }
export interface ItemEntry { id: number; name: string; icon: number }

export interface GameData {
  unitTypes: UnitTypeEntry[]
  characters: CharacterEntry[]
  items: ItemEntry[]
  levelTables: Record<string, number[]>
  unitMaxExp: Record<string, number>
}

/** 提取脚本产物（见 scripts/extract-game-data.mjs） */
export const gameData = data as GameData

export const ALL_UNIT_TYPE_IDS: number[] = gameData.unitTypes.map((u) => u.id)

const unitTypeMap = new Map<number, UnitTypeEntry>(gameData.unitTypes.map((u) => [u.id, u]))
const characterMap = new Map<number, CharacterEntry>(gameData.characters.map((c) => [c.id, c]))
const itemMap = new Map<number, ItemEntry>(gameData.items.map((i) => [i.id, i]))

export function unitTypeById(id: number): UnitTypeEntry | undefined { return unitTypeMap.get(id) }
export function characterById(id: number): CharacterEntry | undefined { return characterMap.get(id) }
export function itemById(id: number): ItemEntry | undefined { return itemMap.get(id) }

export function levelTableOf(levelType: number): number[] {
  return gameData.levelTables[String(levelType)] ?? [0, 0, 0, 0, 0, 0, 0]
}

export function unitMaxExpOf(unitTypeId: number): number {
  return gameData.unitMaxExp[String(unitTypeId)] ?? UNIT_EXP6_FALLBACK
}
```

注意：`data/game-data.json` 在 Task 7 由提取脚本生成；本任务先提交一个**占位有效版本**（空数组结构）以保证类型检查通过，Task 7 替换为真实产物：

```json
{ "unitTypes": [], "characters": [], "items": [], "levelTables": {}, "unitMaxExp": {} }
```

同时给 `src/common/data/game-data.json` 配 `src/common/types/game-data.d.ts`（或开启 resolveJsonModule，electron-vite 模板 vite 默认支持 JSON import，tsconfig 加 `"resolveJsonModule": true`、`"esModuleInterop": true`）。

- [ ] **Step 5: 实现 saveModel.ts**

`src/common/saveModel.ts`：

```ts
import { ALL_UNIT_TYPE_IDS, levelTableOf, unitMaxExpOf, type GameData } from './gameData'
import { CHARACTER_MAX_EXP, characterExpForLevel, unitLevelForExp } from './level'
import { getField, parseEs3, setField, stringifyEs3, type Es3Doc } from './es3'

export interface UnitEntry {
  unitType: number
  armyId: number
  characterId: number
  items: number[]
  custom: number
  number: number[]
  exp: number
  playerName: string
}

const REQUIRED_KEYS = ['PlayerUnits', 'PlayerCharacters', 'PlayerArmyId', 'PlayerCredit'] as const

export class SaveData {
  readonly doc: Es3Doc

  private constructor(doc: Es3Doc) {
    this.doc = doc
  }

  static load(text: string): SaveData {
    const doc = parseEs3(text)
    for (const key of REQUIRED_KEYS) {
      if (!doc[key]) throw new Error(`存档缺少字段 ${key}，格式不兼容`)
    }
    return new SaveData(doc)
  }

  serialize(): string {
    return stringifyEs3(this.doc)
  }

  private num(key: string): number { return getField<number>(this.doc, key) }
  private setNum(key: string, v: number): void { setField(this.doc, key, Math.round(v)) }

  get armyId(): number { return this.num('PlayerArmyId') }
  get armyName(): string { return getField<string>(this.doc, 'PlayArmyName') }
  get leaderName(): string { return getField<string>(this.doc, 'PlayerLeaderName') }
  get day(): number { return this.num('PlayerDay') }
  get saveTime(): string { return getField<string>(this.doc, 'RealTime') }
  get flag(): number { return this.num('PlayerFlag') }
  get star(): number { return this.num('PlayerStar') }
  setStar(v: number): void { this.setNum('PlayerStar', v) }
  get credit(): number { return this.num('PlayerCredit') }
  setCredit(v: number): void { this.setNum('PlayerCredit', v) }
  get prestige(): number { return this.num('PlayerPrestige') }
  setPrestige(v: number): void { this.setNum('PlayerPrestige', v) }

  get medals(): number[] { return getField<number[]>(this.doc, 'PlayerMedals') }
  setMedal(i: number, v: number): void { this.medals[i] = Math.round(v) }
  get relationships(): number[] { return getField<number[]>(this.doc, 'PlayerRelationships') }
  setRelationship(i: number, v: number): void { this.relationships[i] = Math.round(v) }

  docPlayerItems(): number[] { return getField<number[]>(this.doc, 'PlayerItems') }

  get units(): UnitEntry[] { return getField<UnitEntry[]>(this.doc, 'PlayerUnits') }

  setUnitExp(index: number, exp: number): void {
    this.units[index].exp = Math.max(0, Math.round(exp))
  }

  /** 全部机体拉满（按各机型 levelType 的 EXP6），返回修改台数 */
  maxAllUnits(_gd?: GameData): number {
    let n = 0
    for (const u of this.units) {
      const target = unitMaxExpOf(u.unitType)
      if (u.exp < target) {
        u.exp = target
        n++
      }
    }
    return n
  }

  unitLevelOf(unit: UnitEntry): number {
    const t = unitTypeByIdSafe(unit.unitType)
    return unitLevelForExp(unit.exp, levelTableOf(t?.levelType ?? 12))
  }

  /** 删除机体并归还装备（模仿游戏 Unit.Remove） */
  removeUnit(index: number): void {
    const u = this.units[index]
    if (!u) return
    const items = this.docPlayerItems()
    for (const it of u.items ?? []) {
      if (it > 0) items[it - 1] = (items[it - 1] ?? 0) + 1
    }
    this.units.splice(index, 1)
  }

  /** 新增机体；level 0..6 */
  addUnit(_gd: GameData | undefined, unitTypeId: number, level: number): UnitEntry {
    const table = levelTableOf(unitTypeByIdSafe(unitTypeId)?.levelType ?? 12)
    const lv = Math.min(Math.max(level, 0), 6)
    const exp = lv === 0 ? 0 : table[lv]
    const u: UnitEntry = {
      unitType: unitTypeId,
      armyId: this.armyId,
      characterId: 0,
      items: [],
      custom: 0,
      number: [0, 0],
      exp: Math.max(exp, unitMaxExpOf(unitTypeId) * 0),
      playerName: ''
    }
    if (lv > 0) u.exp = table[lv]
    this.units.push(u)
    return u
  }

  get characters(): number[] { return getField<number[]>(this.doc, 'PlayerCharacters') }
  get characterExps(): number[] { return getField<number[]>(this.doc, 'PlayerCharacterEXPs') }

  setPilotExp(index: number, exp: number): void {
    this.characterExps[index] = Math.max(0, Math.round(exp))
  }

  /** 全部驾驶员满级，返回修改人数 */
  maxAllPilots(): number {
    let n = 0
    const exps = this.characterExps
    for (let i = 0; i < exps.length; i++) {
      if (exps[i] < CHARACTER_MAX_EXP) {
        exps[i] = CHARACTER_MAX_EXP
        n++
      }
    }
    return n
  }

  get unlockedUnitTypes(): number[] { return getField<number[]>(this.doc, 'PlayerUnlockedUnitTypes') }
  setUnlockedUnitTypes(ids: number[]): void { setField(this.doc, 'PlayerUnlockedUnitTypes', [...ids]) }
  unlockAllUnitTypes(): void { this.setUnlockedUnitTypes([...ALL_UNIT_TYPE_IDS]) }

  get unlockedItems(): number[] { return getField<number[]>(this.doc, 'PlayerUnlockedItems') }
  unlockAllItems(gd: GameData): void { this.setUnlockedItems(gd.items.map((i) => i.id)) }
  setUnlockedItems(ids: number[]): void { setField(this.doc, 'PlayerUnlockedItems', [...ids]) }
}

import { unitTypeById } from './gameData'
function unitTypeByIdSafe(id: number) { return unitTypeById(id) }
```

（实现时把文件底部的 `unitTypeByIdSafe` 合并进顶部 import，保持整洁。）

- [ ] **Step 6: 实现 collection 支持（同文件底部）**

```ts
export interface CollectionSnapshot { endings: boolean[]; units: number[]; members: number[] }

export function loadCollectionText(text: string): CollectionSnapshot {
  const doc = parseEs3(text)
  return {
    endings: getField<boolean[]>(doc, 'Endings'),
    units: getField<number[]>(doc, 'Units'),
    members: getField<number[]>(doc, 'Members')
  }
}

/** 结局全开；机体收藏=7(+6)；成员收藏=10(Lv10) */
export function maxCollection(c: CollectionSnapshot): void {
  for (let i = 0; i < c.endings.length; i++) c.endings[i] = true
  for (let i = 0; i < c.units.length; i++) c.units[i] = 7
  for (let i = 0; i < c.members.length; i++) c.members[i] = 10
}

export function serializeCollectionText(c: CollectionSnapshot): string {
  const doc: Es3Doc = {
    Endings: { __type: 'System.Boolean[],mscorlib', value: c.endings },
    Units: { __type: 'System.Int32[],mscorlib', value: c.units },
    Members: { __type: 'System.Int32[],mscorlib', value: c.members }
  }
  return stringifyEs3(doc)
}
```

注意：`serializeCollectionText` 里 `characterExpForLevel`、`unitLevelForExp` 若未用到则不 import（避免 TS unused 报错）；`characterExpForLevel` 在 addUnit 中未用时删除该 import。

- [ ] **Step 7: 测试通过**

Run: `npm test -- saveModel`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/common tests
git commit -m "feat: 存档模型（资源/机体/驾驶员/解锁/图鉴）+ 合成夹具测试"
```

---

### Task 5: 素材提取脚本 + 生成数据

**Files:**
- Create: `scripts/extract-game-data.mjs`
- Modify: `src/common/data/game-data.json`（替换为真实产物）
- Create: `src/renderer/src/assets/game/*.png`（提取产物，~200 个小 PNG）
- Test: `tests/gameData.spec.ts`

**Interfaces:**
- Produces: `game-data.json` 字段 `unitTypes[{id,name,kind,size,levelType,model}]`、`characters[{id,name,portrait}]`、`items[{id,name,icon}]`、`levelTables{"1".."12":[7个]}`、`unitMaxExp{}`；PNG 命名 `unit-<id>.png`、`portrait-<id>.png`、`item-<id>.png`、`flag-round-<n>.png`、`tradition-<n>.png`
- Consumes: 本机游戏目录 + AssetRipper（README 注明可选；仓库已含产物）

- [ ] **Step 1: 写提取脚本**

`scripts/extract-game-data.mjs`（完整实现）：

```js
#!/usr/bin/env node
/**
 * Chaos Front 游戏素材提取
 * 用法:
 *   node scripts/extract-game-data.mjs --game "F:\...\Chaos Front_Data" \
 *     --ripper "C:\path\AssetRipper.GUI.Free.exe" --out .
 * Phase1 数据: 直接从 resources.assets 抠 TextAsset XML（无需 AssetRipper）
 * Phase2 图像: AssetRipper headless 导出后按 Sprite 矩形裁切
 */
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { PNG } from 'pngjs'

const args = parseArgs(process.argv.slice(2))
const GAME = args.game
const RIPPER = args.ripper
const OUT = args.out ?? '.'
const PORT = 18923
const EXPORT = path.join(process.env.TEMP ?? '/tmp', 'cfse_rip_export')

if (!GAME) die('缺少 --game <Chaos Front_Data 目录>')

// ---------- Phase 1: TextAsset XML ----------
const resAssets = path.join(GAME, 'resources.assets')
const bin = fs.readFileSync(resAssets)
const tables = {
  unitType: extractXml('<UnitTypeData>'),
  unitLevel: extractXml('<UnitLevelData>'),
  character: extractXml('<CharacterData>'),
  item: extractXml('<ItemData>'),
  language: extractXml('<LanguageData>'),
  army: extractXml('<ArmyData>')
}

const lang = parseXmlItems(tables.language).map((attrs) => xmlUnescape(attrs.CN ?? ''))

const unitTypes = parseXmlItems(tables.unitType).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `机型${a.Index}`,
  kind: num(a.Kind), size: num(a.Size), levelType: num(a.LevelType), model: num(a.Model)
}))

const levelTables = {}
for (const a of parseXmlItems(tables.unitLevel)) {
  levelTables[String(num(a.Index))] = Array.from({ length: 7 }, (_, i) => num(a[`EXP${i}`]))
}

const characters = parseXmlItems(tables.character).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `驾驶员${a.Index}`, portrait: num(a.Portrait)
}))

const items = parseXmlItems(tables.item).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `装备${a.Index}`, icon: num(a.Icon)
}))

const armies = parseXmlItems(tables.army).map((a) => ({
  id: num(a.Index), name: lang[num(a.Name) - 1] ?? `军团${a.Index}`, flag: num(a.Flag)
}))

const unitMaxExp = {}
for (const u of unitTypes) {
  const t = levelTables[String(u.levelType)]
  unitMaxExp[String(u.id)] = t ? t[6] : 11970
}

function extractXml(tag) {
  const close = `</${tag.slice(1, -1)}>`
  const start = bin.indexOf(Buffer.from(tag))
  if (start < 0) die(`resources.assets 中找不到 ${tag}`)
  const end = bin.indexOf(Buffer.from(close), start)
  if (end < 0) die(`${tag} 未闭合`)
  return bin.slice(start, end + close.length).toString('utf8')
}
function parseXmlItems(xml) {
  const out = []
  for (const m of xml.matchAll(/<Item\s+([^>]+?)\/>/g)) {
    const attrs = {}
    for (const am of m[1].matchAll(/([\w]+)="([^"]*)"/g)) attrs[am[1]] = am[2]
    out.push(attrs)
  }
  return out
}
function xmlUnescape(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&')
}
function num(v) { return parseInt(v, 10) || 0 }
function die(msg) { console.error(msg); process.exit(1) }
function parseArgs(argv) {
  const o = {}
  for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) o[argv[i].slice(2)] = argv[i + 1]
  return o
}

// ---------- Phase 2: AssetRipper 导出 ----------
let server = null
if (RIPPER) {
  fs.rmSync(EXPORT, { recursive: true, force: true })
  server = spawn(RIPPER, ['--headless=true', `--port=${PORT}`], { stdio: 'ignore' })
  await waitHttp(PORT, 30000)
  await post(PORT, '/LoadFolder', { path: path.dirname(GAME) })
  console.log('AssetRipper 加载完成，开始导出（可能需要几分钟）...')
  await post(PORT, '/Export/PrimaryContent', { path: EXPORT })
  server.kill()
  console.log('导出完成:', EXPORT)
}

// ---------- Phase 3: 裁切/拷贝图像 ----------
const texDir = path.join(EXPORT, 'Assets', 'Texture2D')
const spriteDir = path.join(EXPORT, 'Assets', 'Sprite')
const imgOut = path.join(OUT, 'src', 'renderer', 'src', 'assets', 'game')
fs.mkdirSync(imgOut, { recursive: true })

const stats = { copied: 0, cropped: 0, missing: 0 }

function copyPng(srcName, outName) {
  const src = path.join(texDir, `${srcName}.png`)
  if (!fs.existsSync(src)) { stats.missing++; return false }
  fs.copyFileSync(src, path.join(imgOut, `${outName}.png`))
  stats.copied++
  return true
}

function cropSprite(spriteBase, texName, outName) {
  const jsonPath = path.join(spriteDir, `${spriteBase}.json`)
  const texPath = path.join(texDir, `${texName}.png`)
  if (!fs.existsSync(jsonPath) || !fs.existsSync(texPath)) { stats.missing++; return false }
  const meta = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
  const r = meta.m_RD.m_TextureRect
  const png = PNG.sync.read(fs.readFileSync(texPath))
  const x = Math.floor(r.m_X), w = Math.ceil(r.m_Width), h = Math.ceil(r.m_Height)
  const y = Math.floor(png.height - r.m_Y - r.m_Height) // Unity 左下原点 → PNG 左上
  const out = new PNG({ width: w, height: h })
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const si = ((y + py) * png.width + (x + px)) << 2
      const di = (py * w + px) << 2
      for (let k = 0; k < 4; k++) out.data[di + k] = png.data[si + k]
    }
  }
  fs.writeFileSync(path.join(imgOut, `${outName}.png`), PNG.sync.write(out))
  stats.cropped++
  return true
}

// 机体/飞船: 92 种 → mapUnit<model>_0 裁切
for (const u of unitTypes) cropSprite(`mapUnit${u.model}_0`, `mapUnit${u.model}`, `unit-${u.id}`)

// 驾驶员头像: 独立贴图优先
for (const c of characters) {
  if (!copyPng(`portrait${c.portrait}`, `portrait-${c.id}`)) cropSprite(`portrait${c.portrait}`, `portrait${c.portrait}`, `portrait-${c.id}`)
}

// 装备图标
for (const it of items) cropSprite(`itemIcon_${it.icon}`, 'itemIcon', `item-${it.id}`)

// 军团旗帜 + 传统图标（存在才拷）
for (let n = 0; n <= 32; n++) copyPng(`flagRound${n}`, `flag-round-${n}`)
for (let n = 0; n <= 11; n++) cropSprite(`traditionIcon_${n}`, 'traditionIcon', `tradition-${n}`)

// ---------- Phase 4: game-data.json ----------
const gameData = { unitTypes, characters, items, armies, levelTables, unitMaxExp }
const jsonPath = path.join(OUT, 'src', 'common', 'data', 'game-data.json')
fs.mkdirSync(path.dirname(jsonPath), { recursive: true })
fs.writeFileSync(jsonPath, JSON.stringify(gameData, null, 2) + '\n', 'utf8')

console.log('完成:', JSON.stringify(stats), '| unitTypes:', unitTypes.length, '| characters:', characters.length, '| items:', items.length)
if (unitTypes.length !== 92) die('机型数量异常（应为 92），检查提取')

function waitHttp(port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now()
    const tick = () => {
      const req = http.get({ host: '127.0.0.1', port, path: '/' }, (res) => { res.resume(); resolve() })
      req.on('error', () => {
        if (Date.now() - t0 > timeoutMs) reject(new Error('AssetRipper 启动超时'))
        else setTimeout(tick, 1000)
      })
    }
    tick()
  })
}
function post(port, p, body) {
  const data = new URLSearchParams(body).toString()
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } }, (res) => {
      res.resume()
      res.statusCode < 400 ? resolve() : reject(new Error(`${p} -> ${res.statusCode}`))
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}
```

- [ ] **Step 2: 运行脚本**

Run:
```bash
node scripts/extract-game-data.mjs --game "F:\SteamLibrary\steamapps\common\Chaos Front\Chaos Front_Data" --ripper "C:\Users\zhang\AppData\Local\Temp\opencode\assetripper\AssetRipper.GUI.Free.exe" --out .
```
Expected: 输出 `unitTypes: 92`、`characters` ≥ 40、导出与裁切计数；若 flagRound 命名带下划线（`flagRound_0`），改 copyPng 名后重跑。

- [ ] **Step 3: 数据完整性测试**

`tests/gameData.spec.ts`：

```ts
import { describe, expect, it } from 'vitest'
import { gameData } from '../src/common/gameData'

describe('game-data.json（提取产物）', () => {
  it('has 92 unit types', () => {
    expect(gameData.unitTypes).toHaveLength(92)
    expect(gameData.unitTypes[0]).toMatchObject({ id: 1, kind: 1, levelType: 3 })
  })
  it('has 12 level tables with valid EXP6', () => {
    expect(Object.keys(gameData.levelTables)).toHaveLength(12)
    const max6 = Object.values(gameData.levelTables).map((t) => t[6])
    expect(Math.max(...max6)).toBe(11970)
  })
  it('every unit type has maxExp >= 2400', () => {
    for (const u of gameData.unitTypes) {
      expect(gameData.unitMaxExp[String(u.id)]).toBeGreaterThanOrEqual(2400)
    }
  })
  it('has characters and items', () => {
    expect(gameData.characters.length).toBeGreaterThan(30)
    expect(gameData.items).toHaveLength(16)
  })
})
```

Run: `npm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add scripts src/common/data src/renderer/src/assets/game tests/gameData.spec.ts
git commit -m "feat: 游戏素材提取（机型表/等级表/名字/图标/头像）"
```

---

### Task 6: 主进程文件层 + IPC

**Files:**
- Create: `src/main/files.ts`、`src/common/ipc.ts`、`src/preload/index.d.ts`（补充类型）
- Modify: `src/main/index.ts`、`src/preload/index.ts`
- Test: `tests/files.spec.ts`

**Interfaces:**
- Consumes: `fs/path`、`SaveData`（槽位摘要只读字段）
- Produces（preload 暴露 `window.api`）:

```ts
// src/common/ipc.ts — 共享类型
export interface SlotInfo {
  slot: number; exists: boolean
  armyName?: string; leaderName?: string; day?: number; saveTime?: string
  unitCount?: number; flag?: number
}
export interface BackupInfo { name: string; mtimeMs: number; size: number }
export interface WriteResult { ok: boolean; error?: string; backup?: string }

// preload api
export interface SaveEditorApi {
  detectSaveDir(): Promise<string | null>
  chooseSaveDir(): Promise<string | null>
  listSlots(dir: string): Promise<SlotInfo[]>
  readSlot(dir: string, slot: number): Promise<string>
  writeSlot(dir: string, slot: number, text: string): Promise<WriteResult>
  listBackups(dir: string): Promise<BackupInfo[]>
  restoreBackup(dir: string, name: string): Promise<WriteResult>
  readCollection(dir: string): Promise<string>
  writeCollection(dir: string, text: string): Promise<WriteResult>
}
```

- [ ] **Step 1: 写 files.ts 失败测试（备份轮转逻辑）**

`tests/files.spec.ts`（用临时目录测核心逻辑，`files.ts` 把纯逻辑拆成可测函数）：

```ts
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { pruneBackups } from '../src/main/files'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cfse-'))
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }))

describe('pruneBackups', () => {
  it('keeps newest N backups', () => {
    for (let i = 0; i < 13; i++) {
      const t = new Date(2026, 0, 1, 0, 0, i).getTime()
      const f = path.join(tmp, `savedata0_2026010${1}_0000${String(i).padStart(2, '0')}.cf.bak`)
      fs.writeFileSync(f, 'x')
      fs.utimesSync(f, new Date(t), new Date(t))
    }
    pruneBackups(tmp, 'savedata0', 10)
    const left = fs.readdirSync(tmp).filter((f) => f.endsWith('.bak'))
    expect(left).toHaveLength(10)
  })
})
```

- [ ] **Step 2: 运行确认失败**

Run: `npm test -- files`
Expected: FAIL

- [ ] **Step 3: 实现 files.ts**

`src/main/files.ts`：

```ts
import { app, dialog } from 'electron'
import fs from 'node:fs'
import path from 'node:path'
import type { BackupInfo, SlotInfo } from '../common/ipc'

const SLOT_COUNT = 6
const BACKUP_KEEP = 10

export function defaultSaveDir(): string | null {
  const p = path.join(process.env.USERPROFILE ?? app.getPath('home'), 'AppData', 'LocalLow', 'ChaosGalaxyStudio', 'Chaos Front')
  return fs.existsSync(p) ? p : null
}

export function slotFileName(slot: number): string {
  return `savedata${slot}.cf`
}

export function listSlots(dir: string): SlotInfo[] {
  const out: SlotInfo[] = []
  for (let slot = 0; slot < SLOT_COUNT; slot++) {
    const file = path.join(dir, slotFileName(slot))
    if (!fs.existsSync(file)) {
      out.push({ slot, exists: false })
      continue
    }
    const text = fs.readFileSync(file, 'utf8')
    out.push({ slot, exists: true, ...summarize(text) })
  }
  return out
}

export function summarize(text: string): Partial<SlotInfo> {
  try {
    const doc = JSON.parse(text)
    const value = (k: string) => doc[k]?.value
    return {
      armyName: value('PlayArmyName'),
      leaderName: value('PlayerLeaderName'),
      day: value('PlayerDay'),
      saveTime: value('RealTime'),
      flag: value('PlayerFlag'),
      unitCount: Array.isArray(value('PlayerUnits')?.value) ? value('PlayerUnits').value.length : undefined
    }
  } catch {
    return {}
  }
}

export function readSlotFile(dir: string, slot: number): string {
  return fs.readFileSync(path.join(dir, slotFileName(slot)), 'utf8')
}

/** 备份 → 临时文件 → 原子替换 */
export function writeSlotFile(dir: string, slot: number, text: string): { backup: string } {
  const target = path.join(dir, slotFileName(slot))
  const backup = backupFile(dir, target)
  const tmp = `${target}.tmp-${Date.now()}`
  fs.writeFileSync(tmp, text, 'utf8')
  fs.renameSync(tmp, target)
  return { backup }
}

export function backupFile(dir: string, target: string): string {
  const backupDir = path.join(dir, 'backup')
  fs.mkdirSync(backupDir, { recursive: true })
  const base = path.basename(target, path.extname(target))
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)
  const dest = path.join(backupDir, `${base}_${stamp}.cf.bak`)
  if (fs.existsSync(target)) fs.copyFileSync(target, dest)
  pruneBackups(backupDir, base, BACKUP_KEEP)
  return dest
}

export function pruneBackups(backupDir: string, base: string, keep: number): void {
  const files = fs.readdirSync(backupDir)
    .filter((f) => f.startsWith(`${base}_`) && f.endsWith('.cf.bak'))
    .map((f) => ({ f, m: fs.statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
  for (const x of files.slice(keep)) fs.rmSync(path.join(backupDir, x.f))
}

export function listBackups(dir: string, slot: number): BackupInfo[] {
  const backupDir = path.join(dir, 'backup')
  const base = slotFileName(slot).replace('.cf', '')
  if (!fs.existsSync(backupDir)) return []
  return fs.readdirSync(backupDir)
    .filter((f) => f.startsWith(`${base}_`) && f.endsWith('.cf.bak'))
    .map((f) => {
      const st = fs.statSync(path.join(backupDir, f))
      return { name: f, mtimeMs: st.mtimeMs, size: st.size }
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
}

export function restoreBackup(dir: string, slot: number, name: string): void {
  const backupDir = path.join(dir, 'backup')
  const safe = path.basename(name) // 防路径穿越
  const src = path.join(backupDir, safe)
  if (!fs.existsSync(src)) throw new Error(`备份不存在: ${safe}`)
  const target = path.join(dir, slotFileName(slot))
  const tmp = `${target}.tmp-${Date.now()}`
  fs.copyFileSync(src, tmp)
  fs.renameSync(tmp, target)
}

export function readCollectionFile(dir: string): string {
  return fs.readFileSync(path.join(dir, 'collection.cf'), 'utf8')
}

export function writeCollectionFile(dir: string, text: string): { backup: string } {
  const target = path.join(dir, 'collection.cf')
  const backup = backupFile(dir, target)
  const tmp = `${target}.tmp-${Date.now()}`
  fs.writeFileSync(tmp, text, 'utf8')
  fs.renameSync(tmp, target)
  return { backup }
}

export async function chooseSaveDir(): Promise<string | null> {
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return r.canceled ? null : r.filePaths[0]
}
```

`src/main/index.ts` 中注册 IPC（在 `app.whenReady()` 之后）：

```ts
import { ipcMain } from 'electron'
import * as files from './files'

ipcMain.handle('saves:detect', () => files.defaultSaveDir())
ipcMain.handle('saves:choose', () => files.chooseSaveDir())
ipcMain.handle('saves:listSlots', (_e, dir: string) => files.listSlots(dir))
ipcMain.handle('saves:readSlot', (_e, dir: string, slot: number) => files.readSlotFile(dir, slot))
ipcMain.handle('saves:writeSlot', (_e, dir: string, slot: number, text: string) => {
  try { return { ok: true, backup: files.writeSlotFile(dir, slot, text).backup } }
  catch (err) { return { ok: false, error: String(err) } }
})
ipcMain.handle('saves:listBackups', (_e, dir: string, slot: number) => files.listBackups(dir, slot))
ipcMain.handle('saves:restoreBackup', (_e, dir: string, slot: number, name: string) => {
  try { files.restoreBackup(dir, slot, name); return { ok: true } }
  catch (err) { return { ok: false, error: String(err) } }
})
ipcMain.handle('saves:readCollection', (_e, dir: string) => files.readCollectionFile(dir))
ipcMain.handle('saves:writeCollection', (_e, dir: string, text: string) => {
  try { return { ok: true, backup: files.writeCollectionFile(dir, text).backup } }
  catch (err) { return { ok: false, error: String(err) } }
})
```

- [ ] **Step 4: 实现 preload**

`src/preload/index.ts`：

```ts
import { contextBridge, ipcRenderer } from 'electron'
import type { SaveEditorApi } from '../common/ipc'

const api: SaveEditorApi = {
  detectSaveDir: () => ipcRenderer.invoke('saves:detect'),
  chooseSaveDir: () => ipcRenderer.invoke('saves:choose'),
  listSlots: (dir) => ipcRenderer.invoke('saves:listSlots', dir),
  readSlot: (dir, slot) => ipcRenderer.invoke('saves:readSlot', dir, slot),
  writeSlot: (dir, slot, text) => ipcRenderer.invoke('saves:writeSlot', dir, slot, text),
  listBackups: (dir, slot) => ipcRenderer.invoke('saves:listBackups', dir, slot),
  restoreBackup: (dir, slot, name) => ipcRenderer.invoke('saves:restoreBackup', dir, slot, name),
  readCollection: (dir) => ipcRenderer.invoke('saves:readCollection', dir),
  writeCollection: (dir, text) => ipcRenderer.invoke('saves:writeCollection', dir, text)
}

contextBridge.exposeInMainWorld('api', api)
```

`src/preload/index.d.ts`：

```ts
import type { SaveEditorApi } from '../common/ipc'

declare global {
  interface Window { api: SaveEditorApi }
}

export {}
```

- [ ] **Step 5: 测试通过 + 构建通过**

Run: `npm test -- files` → PASS
Run: `npm run build` → PASS

- [ ] **Step 6: Commit**

```bash
git add src/main src/preload src/common/ipc.ts tests/files.spec.ts
git commit -m "feat: 主进程文件层（备份/原子写）+ IPC + preload"
```

---

### Task 7: 渲染层基础 + 存档 Tab

**Files:**
- Create: `src/renderer/src/lib/images.ts`、`src/renderer/src/stores/saveStore.ts`、`src/renderer/src/components/SlotsTab.vue`
- Modify: `src/renderer/src/App.vue`、`src/renderer/src/main.ts`（Element Plus + zh-cn + Pinia）
- Delete: 模板默认 `components/VersionFlag.vue` 等演示组件（清理）

**Interfaces:**
- Consumes: `window.api`、`SaveData`、`gameData`
- Produces: `useSaveStore`（后续 Tab 全用它）:

```ts
// stores/saveStore.ts 关键状态/动作
state: {
  saveDir: string
  slots: SlotInfo[]
  currentSlot: number | null
  save: SaveData | null          // 已解析可变快照
  collection: CollectionSnapshot | null
  dirty: boolean
  backupDir: string              // = saveDir + '/backup'
}
actions:
  init(): Promise<void>                    // 探测目录 + 刷新槽位
  chooseDir(): Promise<void>
  refreshSlots(): Promise<void>
  loadSlot(slot: number): Promise<void>    // 读文件 → SaveData.load + collection 读
  saveSlot(): Promise<WriteResult | null>  // serialize → writeSlot → dirty=false → refresh
  saveCollection(): Promise<WriteResult | null>
  maxAllUnits/addUnit/removeUnit/setUnitExp/maxAllPilots/setPilotExp/maxCollection/unlockAll...  // 直接调 SaveData 方法后 dirty=true
```

- [ ] **Step 1: main.ts 全局装配**

```ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import 'element-plus/dist/index.css'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
app.use(createPinia())
app.use(ElementPlus, { locale: zhCn })
app.mount('#app')
```

- [ ] **Step 2: images.ts**

```ts
const images = import.meta.glob('../assets/game/*.png', { eager: true, import: 'default' }) as Record<string, string>

export function gameImage(name: string): string {
  return images[`../assets/game/${name}.png`] ?? ''
}
```

- [ ] **Step 3: saveStore.ts**

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SaveData, loadCollectionText, maxCollection, serializeCollectionText, type CollectionSnapshot } from '../../../common/saveModel'
import type { BackupInfo, SlotInfo, WriteResult } from '../../../common/ipc'

export const useSaveStore = defineStore('save', () => {
  const saveDir = ref('')
  const slots = ref<SlotInfo[]>([])
  const currentSlot = ref<number | null>(null)
  const save = ref<SaveData | null>(null)
  const collection = ref<CollectionSnapshot | null>(null)
  const dirty = ref(false)
  const backups = ref<BackupInfo[]>([])

  function markDirty(): void { dirty.value = true }

  async function refreshSlots(): Promise<void> {
    slots.value = await window.api.listSlots(saveDir.value)
  }

  async function init(): Promise<void> {
    saveDir.value = (await window.api.detectSaveDir()) ?? ''
    if (saveDir.value) await refreshSlots()
  }

  async function chooseDir(): Promise<void> {
    const d = await window.api.chooseSaveDir()
    if (d) {
      saveDir.value = d
      await refreshSlots()
    }
  }

  async function loadSlot(slot: number): Promise<void> {
    const text = await window.api.readSlot(saveDir.value, slot)
    save.value = SaveData.load(text)
    currentSlot.value = slot
    dirty.value = false
    try {
      collection.value = loadCollectionText(await window.api.readCollection(saveDir.value))
    } catch {
      collection.value = null
    }
    backups.value = await window.api.listBackups(saveDir.value, slot)
  }

  async function saveSlot(): Promise<WriteResult | null> {
    if (!save.value || currentSlot.value === null) return null
    const r = await window.api.writeSlot(saveDir.value, currentSlot.value, save.value.serialize())
    if (r.ok) {
      dirty.value = false
      backups.value = await window.api.listBackups(saveDir.value, currentSlot.value)
      await refreshSlots()
    }
    return r
  }

  async function saveCollectionData(): Promise<WriteResult | null> {
    if (!collection.value) return null
    const r = await window.api.writeCollection(saveDir.value, serializeCollectionText(collection.value))
    return r
  }

  return {
    saveDir, slots, currentSlot, save, collection, dirty, backups,
    markDirty, refreshSlots, init, chooseDir, loadSlot, saveSlot, saveCollectionData
  }
})
```

（后续任务给 store 追加“写穿”动作时直接在 setup 里定义并 return。）

- [ ] **Step 4: App.vue 六 Tab 框架**

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from './stores/saveStore'
import SlotsTab from './components/SlotsTab.vue'
import ResourcesTab from './components/ResourcesTab.vue'
import UnitsTab from './components/UnitsTab.vue'
import PilotsTab from './components/PilotsTab.vue'
import UnlockTab from './components/UnlockTab.vue'
import CollectionTab from './components/CollectionTab.vue'

const store = useSaveStore()
const tab = ref('slots')

onMounted(() => store.init())

async function saveAll(): Promise<void> {
  const r = await store.saveSlot()
  if (!r) return
  r.ok ? ElMessage.success(`已保存（备份 ${r.backup}）`) : ElMessage.error(r.error)
}
</script>

<template>
  <el-container class="root">
    <el-header class="header">
      <span class="title">Chaos Front 存档修改器</span>
      <span class="dir">{{ store.saveDir || '未找到存档目录' }}</span>
      <el-button v-if="store.save" type="primary" :disabled="!store.dirty" @click="saveAll">
        保存到存档{{ store.dirty ? '（有未保存更改）' : '' }}
      </el-button>
    </el-header>
    <el-main>
      <el-alert v-if="!store.saveDir" type="warning" title="未自动找到存档目录，请手动选择" :closable="false" show-icon />
      <el-tabs v-model="tab">
        <el-tab-pane label="存档" name="slots"><SlotsTab /></el-tab-pane>
        <el-tab-pane label="资源" name="resources" :disabled="!store.save"><ResourcesTab /></el-tab-pane>
        <el-tab-pane label="机体 / 飞船" name="units" :disabled="!store.save"><UnitsTab /></el-tab-pane>
        <el-tab-pane label="驾驶员" name="pilots" :disabled="!store.save"><PilotsTab /></el-tab-pane>
        <el-tab-pane label="全解锁" name="unlock" :disabled="!store.save"><UnlockTab /></el-tab-pane>
        <el-tab-pane label="图鉴" name="collection" :disabled="!store.collection"><CollectionTab /></el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<style scoped>
.root { height: 100vh; }
.header { display: flex; align-items: center; gap: 16px; }
.title { font-weight: 700; font-size: 18px; }
.dir { flex: 1; color: #909399; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
```

- [ ] **Step 5: SlotsTab.vue**

```vue
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSaveStore } from '../stores/saveStore'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const backups = computed(() => store.backups)
onMounted(async () => {
  if (store.saveDir && store.slots.length === 0) await store.refreshSlots()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button @click="store.chooseDir()">选择存档目录</el-button>
      <el-button @click="store.refreshSlots()">刷新</el-button>
    </div>
    <el-table :data="store.slots" highlight-current-row @current-change="(row) => row?.exists && store.loadSlot(row.slot)">
      <el-table-column label="槽位" width="70">
        <template #default="{ row }">槽 {{ row.slot }}</template>
      </el-table-column>
      <el-table-column label="军团" min-width="140">
        <template #default="{ row }">
          <span v-if="row.exists"><img v-if="gameImage(`flag-round-${row.flag}`)" :src="gameImage(`flag-round-${row.flag}`)" class="flag" />{{ row.armyName }}</span>
          <el-tag v-else type="info">空</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="leaderName" label="指挥官" width="110" />
      <el-table-column prop="day" label="天数" width="90" />
      <el-table-column prop="unitCount" label="机体数" width="80" />
      <el-table-column prop="saveTime" label="保存时间" min-width="160" />
      <el-table-column label="操作" width="110">
        <template #default="{ row }">
          <el-button size="small" type="primary" :disabled="!row.exists" @click="store.loadSlot(row.slot)">载入</el-button>
        </template>
      </el-table-column>
    </el-table>

    <h4>备份还原（当前槽 {{ store.currentSlot ?? '-' }}）</h4>
    <el-table :data="backups" max-height="240" size="small">
      <el-table-column prop="name" label="备份文件" min-width="260" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ new Date(row.mtimeMs).toLocaleString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="操作" width="100">
        <template #default="{ row }">
          <el-popconfirm title="确认还原该备份？当前文件将先被覆盖" @confirm="store.restoreBackup(row.name)">
            <template #reference><el-button size="small">还原</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.toolbar { margin-bottom: 12px; display: flex; gap: 8px; }
.flag { width: 20px; height: 20px; vertical-align: middle; margin-right: 6px; }
</style>
```

注意：`store.restoreBackup` 为追加动作（在 saveStore 中补）：

```ts
async function restoreBackup(name: string): Promise<void> {
  if (currentSlot.value === null) return
  const r = await window.api.restoreBackup(saveDir.value, currentSlot.value, name)
  if (r.ok) await loadSlot(currentSlot.value)
}
```

- [ ] **Step 6: 其余 5 个 Tab 先建空壳（防止 App.vue 引用报错）**

每个组件暂为：

```vue
<template><el-empty description="下一任务实现" /></template>
```

（本任务结束时 UnitsTab/ResourcesTab/PilotsTab/UnlockTab/CollectionTab 均为占位壳，后续任务替换。）

- [ ] **Step 7: 构建 + 手动 dev 冒烟**

Run: `npm run build` → PASS
Run: `npm run dev` → 应用启动，存档 Tab 列出 4 个槽位（0/1/2/5 有数据），点击载入后其他 Tab 解锁

- [ ] **Step 8: Commit**

```bash
git add src/renderer tests
git commit -m "feat: 渲染层基础 + Pinia store + 存档Tab（槽位/备份还原）"
```

---

### Task 8: 资源 Tab

**Files:**
- Replace: `src/renderer/src/components/ResourcesTab.vue`

**Interfaces:**
- Consumes: `useSaveStore`（`save.value.setCredit(...)` 等，改后 `store.markDirty()`）

- [ ] **Step 1: 实现**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'

const store = useSaveStore()
const save = computed(() => store.save)
const MAX_REL = 999

function wrap(fn: () => void): void {
  fn()
  store.markDirty()
}
function maxResources(): void {
  wrap(() => {
    save.value!.setCredit(99_999_999)
    save.value!.setPrestige(99_999)
    save.value!.setStar(6)
  })
}
</script>

<template>
  <div v-if="save">
    <el-alert type="warning" show-icon :closable="false" title="关系值影响剧情走向，修改可能跳过/触发特定事件" class="warn" />
    <el-form label-width="120px" style="max-width: 520px">
      <el-form-item label="信用点"><el-input-number :model-value="save.credit" :min="0" :max="999999999" :step="10000" @change="(v) => wrap(() => save!.setCredit(v))" /></el-form-item>
      <el-form-item label="威望"><el-input-number :model-value="save.prestige" :min="0" :max="999999" :step="100" @change="(v) => wrap(() => save!.setPrestige(v))" /></el-form-item>
      <el-form-item label="星级"><el-input-number :model-value="save.star" :min="1" :max="6" @change="(v) => wrap(() => save!.setStar(v))" /></el-form-item>
      <el-form-item v-for="i in 4" :key="'medal' + i" :label="`勋章 ${i}`">
        <el-input-number :model-value="save.medals[i - 1]" :min="0" :max="99999" @change="(v) => wrap(() => save!.setMedal(i - 1, v))" />
      </el-form-item>
      <el-form-item v-for="i in 4" :key="'rel' + i" :label="`关系 ${i}`">
        <el-input-number :model-value="save.relationships[i - 1]" :min="0" :max="999" @change="(v) => wrap(() => save!.setRelationship(i - 1, v))" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="maxResources()">一键拉满（信用/威望/星级）</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>.warn { margin-bottom: 16px; max-width: 520px; }</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build` → PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/ResourcesTab.vue
git commit -m "feat: 资源Tab"
```

---

### Task 9: 机体 / 飞船 Tab

**Files:**
- Replace: `src/renderer/src/components/UnitsTab.vue`

**Interfaces:**
- Consumes: `gameData`（unitTypeById/unitMaxExpOf/levelTableOf）、`unitLevelForExp`、store

- [ ] **Step 1: 实现**

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { characterById, gameData, unitTypeById } from '../../../../common/gameData'
import { unitLevelForExp } from '../../../../common/level'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const units = computed(() => store.save?.units ?? [])

function typeName(typeId: number): string {
  return unitTypeById(typeId)?.name ?? `未知机型#${typeId}`
}
function levelOf(u: { unitType: number; exp: number }): number {
  const lt = unitTypeById(u.unitType)?.levelType ?? 12
  return unitLevelForExp(u.exp, gameData.levelTables[String(lt)] ?? [])
}
function pilotName(id: number): string {
  return characterById(id)?.name ?? ''
}
function changed(u: { unitType: number; exp: number }, v: number | undefined): void {
  if (v === undefined || v === null) return
  store.save!.setUnitExp(units.value.indexOf(u), v)
  store.markDirty()
}
function maxAll(): void {
  const n = store.save!.maxAllUnits()
  store.markDirty()
  ElMessage.success(`已拉满 ${n} 台`)
}
function remove(index: number): void {
  store.save!.removeUnit(index)
  store.markDirty()
}

// 添加机体
const addVisible = ref(false)
const addType = ref<number | null>(null)
const addLevel = ref(6)
const typeOptions = computed(() =>
  gameData.unitTypes.map((t) => ({
    id: t.id,
    label: `${t.kind === 1 ? '[舰]' : t.size === 1 ? '[大]' : '[小]'} ${t.name}`
  }))
)
const groups = computed(() => [
  { title: '战舰', ids: gameData.unitTypes.filter((t) => t.kind === 1).map((t) => t.id) },
  { title: '大型机体', ids: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 1).map((t) => t.id) },
  { title: '小型机体', ids: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 0).map((t) => t.id) }
])
function confirmAdd(): void {
  if (!addType.value) return
  store.save!.addUnit(undefined, addType.value, addLevel.value)
  store.markDirty()
  addVisible.value = false
  ElMessage.success('已添加')
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="maxAll()">全部 +6</el-button>
      <el-button @click="addVisible = true">添加机体</el-button>
      <span class="count">共 {{ units.length }} 台</span>
    </div>
    <el-table :data="units" size="small" max-height="560">
      <el-table-column label="" width="56">
        <template #default="{ row }">
          <img :src="gameImage(`unit-${row.unitType}`)" class="unit-img" />
        </template>
      </el-table-column>
      <el-table-column label="名称" min-width="170">
        <template #default="{ row }">
          {{ typeName(row.unitType) }}<el-tag v-if="row.custom > 0" size="small" type="warning" style="margin-left: 6px">改装</el-tag>
          <el-tag size="small" style="margin-left: 6px">+{{ levelOf(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="驾驶员" width="120">
        <template #default="{ row }">
          <span v-if="row.characterId > 0">{{ pilotName(row.characterId) }}</span>
          <span v-else class="dim">—</span>
        </template>
      </el-table-column>
      <el-table-column label="经验" width="180">
        <template #default="{ row }">
          <el-input-number size="small" :model-value="row.exp" :min="0" :max="999999" :step="100" controls-position="right" @change="(v) => changed(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="装备" width="80">
        <template #default="{ row }">{{ row.items.filter((i) => i > 0).length }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90">
        <template #default="{ row }">
          <el-popconfirm title="确认删除该机体？（装备归还仓库）" @confirm="remove(units.indexOf(row))">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="addVisible" title="添加机体" width="560">
      <el-form label-width="90px">
        <el-form-item label="型号">
          <el-select v-model="addType" filterable placeholder="选择型号（可搜索）" style="width: 100%">
            <el-option-group v-for="g in groups" :key="g.title" :label="g.title">
              <el-option v-for="id in g.ids" :key="id" :value="id" :label="typeName(id)" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="初始等级">
          <el-slider v-model="addLevel" :min="0" :max="6" show-stops style="width: 300px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!addType" @click="confirmAdd()">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.count { color: #909399; }
.unit-img { width: 40px; image-rendering: pixelated; }
.dim { color: #c0c4cc; }
</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build` → PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/UnitsTab.vue
git commit -m "feat: 机体/飞船Tab（等级/添加/删除/一键+6）"
```

---

### Task 10: 驾驶员 Tab

**Files:**
- Replace: `src/renderer/src/components/PilotsTab.vue`

- [ ] **Step 1: 实现**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { characterById } from '../../../../common/gameData'
import { CHARACTER_MAX_EXP, characterLevelForExp } from '../../../../common/level'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const pilots = computed(() =>
  (store.save?.characters ?? []).map((id, index) => ({
    id,
    index,
    name: characterById(id)?.name ?? `#${id}`,
    exp: store.save!.characterExps[index] ?? 0
  }))
)

function levelOf(exp: number): number {
  return characterLevelForExp(exp)
}
function setExp(index: number, v: number | undefined): void {
  if (v === undefined || v === null) return
  store.save!.setPilotExp(index, v)
  store.markDirty()
}
function maxAll(): void {
  const n = store.save!.maxAllPilots()
  store.markDirty()
  ElMessage.success(`已满级 ${n} 人`)
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="maxAll()">全部 Lv10</el-button>
      <span class="count">共 {{ pilots.length }} 人</span>
    </div>
    <el-table :data="pilots" size="small" max-height="560">
      <el-table-column label="头像" width="64">
        <template #default="{ row }">
          <img :src="gameImage(`portrait-${row.id}`)" class="avatar" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column label="等级" width="90">
        <template #default="{ row }"><el-tag>Lv{{ levelOf(row.exp) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="经验" width="220">
        <template #default="{ row }">
          <el-input-number size="small" :model-value="row.exp" :min="0" :max="999999" :step="100" controls-position="right" @change="(v) => setExp(row.index, v)" />
        </template>
      </el-table-column>
      <el-table-column label="进度">
        <template #default="{ row }">
          <el-progress :percentage="Math.min(100, Math.round((row.exp / CHARACTER_MAX_EXP) * 100))" :stroke-width="10" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.count { color: #909399; }
.avatar { width: 44px; height: 44px; object-fit: cover; }
</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build` → PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/PilotsTab.vue
git commit -m "feat: 驾驶员Tab（等级/经验/一键满级）"
```

---

### Task 11: 全解锁 Tab

**Files:**
- Replace: `src/renderer/src/components/UnlockTab.vue`

- [ ] **Step 1: 实现**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { gameData } from '../../../../common/gameData'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const unlocked = computed(() => new Set(store.save?.unlockedUnitTypes ?? []))
const unlockedItems = computed(() => new Set(store.save?.unlockedItems ?? []))

const groups = computed(() => [
  { title: '战舰', list: gameData.unitTypes.filter((t) => t.kind === 1) },
  { title: '大型机体', list: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 1) },
  { title: '小型机体', list: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 0) }
])

function toggleType(id: number, on: boolean): void {
  const arr = store.save!.unlockedUnitTypes
  const i = arr.indexOf(id)
  if (on && i < 0) arr.push(id)
  if (!on && i >= 0) arr.splice(i, 1)
  store.markDirty()
}
function selectAll(on: boolean): void {
  store.save!.setUnlockedUnitTypes(on ? gameData.unitTypes.map((t) => t.id) : [])
  store.markDirty()
  ElMessage.success(on ? '已解锁全部机型' : '已清空解锁')
}
function toggleItem(id: number, on: boolean): void {
  const arr = store.save!.unlockedItems
  const i = arr.indexOf(id)
  if (on && i < 0) arr.push(id)
  if (!on && i >= 0) arr.splice(i, 1)
  store.markDirty()
}
function unlockAllItems(): void {
  store.save!.unlockAllItems(gameData)
  store.markDirty()
  ElMessage.success('已解锁全部装备')
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="selectAll(true)">解锁全部机型</el-button>
      <el-button @click="selectAll(false)">全部取消</el-button>
      <el-divider direction="vertical" />
      <el-button @click="unlockAllItems()">解锁全部装备</el-button>
    </div>

    <div v-for="g in groups" :key="g.title" class="group">
      <h4>{{ g.title }}（{{ g.list.filter((t) => unlocked.has(t.id)).length }}/{{ g.list.length }}）</h4>
      <div class="grid">
        <div v-for="t in g.list" :key="t.id" class="cell" :class="{ on: unlocked.has(t.id) }" @click="toggleType(t.id, !unlocked.has(t.id))">
          <img :src="gameImage(`unit-${t.id}`)" />
          <span class="name">{{ t.name }}</span>
        </div>
      </div>
    </div>

    <div class="group">
      <h4>装备（{{ unlockedItems.size }}/{{ gameData.items.length }}）</h4>
      <el-checkbox-group class="item-row" :model-value="[...unlockedItems]">
        <el-checkbox v-for="it in gameData.items" :key="it.id" :value="it.id" @change="(on: boolean) => toggleItem(it.id, on)">
          {{ it.name }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<style scoped>
.toolbar { margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.grid { display: flex; flex-wrap: wrap; gap: 8px; }
.cell { width: 88px; padding: 6px; border: 2px solid transparent; border-radius: 6px; text-align: center; cursor: pointer; opacity: 0.45; }
.cell:hover { background: #f5f7fa; }
.cell.on { opacity: 1; border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.cell img { width: 44px; image-rendering: pixelated; }
.name { display: block; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-row { display: flex; flex-wrap: wrap; gap: 4px 16px; }
</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build` → PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/UnlockTab.vue
git commit -m "feat: 全解锁Tab（机型分组网格 + 装备）"
```

---

### Task 12: 图鉴 Tab

**Files:**
- Replace: `src/renderer/src/components/CollectionTab.vue`

- [ ] **Step 1: 实现**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { maxCollection } from '../../../../common/saveModel'

const store = useSaveStore()
const col = computed(() => store.collection)
const endingsCount = computed(() => col.value?.endings.filter(Boolean).length ?? 0)

function maxAll(): void {
  maxCollection(col.value!)
  store.markDirty()
  ElMessage.success('图鉴已拉满（记得点保存）')
}
async function saveCol(): Promise<void> {
  const r = await store.saveCollectionData()
  if (r) r.ok ? ElMessage.success(`图鉴已写入（备份 ${r.backup}）`) : ElMessage.error(r.error)
}
</script>

<template>
  <div v-if="col">
    <div class="toolbar">
      <el-button type="primary" @click="maxAll()">一键拉满（结局 + 收藏度）</el-button>
      <el-button type="success" @click="saveCol()">保存图鉴文件</el-button>
      <span class="count">结局 {{ endingsCount }}/{{ col.endings.length }}</span>
    </div>
    <el-alert type="info" show-icon :closable="false"
      title="图鉴写入独立文件 collection.cf，与存档槽互不影响；机体收藏拉满为+6、成员拉满为Lv10" class="warn" />
    <h4>结局</h4>
    <el-checkbox-group :model-value="col.endings.map((v, i) => (v ? i : -1)).filter((i) => i >= 0)">
      <el-checkbox v-for="(v, i) in col.endings" :key="i" :value="i" :label="`结局 ${i + 1}`" @change="(on: boolean) => { col!.endings[i] = on; store.markDirty() }" />
    </el-checkbox-group>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.count { color: #909399; }
.warn { margin-bottom: 12px; max-width: 640px; }
</style>
```

- [ ] **Step 2: 构建验证**

Run: `npm run build` → PASS

- [ ] **Step 3: Commit**

```bash
git add src/renderer/src/components/CollectionTab.vue
git commit -m "feat: 图鉴Tab"
```

---

### Task 13: 打包配置 + 文档

**Files:**
- Modify: `electron-builder.yml`
- Create: `README.md`、`LICENSE`（MIT）、补充 `.gitignore`

**Interfaces:** 无代码接口

- [ ] **Step 1: electron-builder.yml**

```yaml
appId: studio.chaosgalaxy.saveeditor
productName: ChaosFrontSaveEditor
directories:
  buildResources: build
files:
  - out/**
win:
  target:
    - target: portable
      arch: [x64]
npmRebuild: false
```

（若模板自带 electron-builder.yml 为 NSIS，改为以上 portable 配置；`package.json` scripts 增加：`"dist": "npm run build && electron-builder --win"`）

- [ ] **Step 2: .gitignore 追加**

```
backup/
*.cf
!tests/fixtures/*.json
```

（确保任何真实存档不会被误提交。）

- [ ] **Step 3: README.md**

内容包含：项目简介（一句话）、功能列表（六大模块）、下载（Releases 便携 exe）、使用方法（改前游戏退出、自动备份说明、还原方法）、开发者构建（npm i / dev / dist）、素材提取脚本用法（需自备游戏与 AssetRipper）、免责声明（仅供单机学习使用、素材版权归 ChaosGalaxyStudio、修改存档风险自担、务必依赖自动备份）。

- [ ] **Step 4: LICENSE**

标准 MIT 文本，版权行 `Copyright (c) 2026 <用户GitHub名>`（实施时让用户确认填什么名字，未确认前用 `chaos-front-save-editor contributors`）。

- [ ] **Step 5: 打包验证**

Run: `npm run dist`
Expected: `dist/` 下生成 portable exe；双击启动验证

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: portable 打包配置 + README/LICENSE"
```

---

### Task 14: 端到端验证

**Files:** 无新增（验证任务）

**Interfaces:** 无

- [ ] **Step 1: 自动验证**

```bash
npm test        # 全部测试通过
npm run build   # 构建通过
```

- [ ] **Step 2: 真实存档副本验证**

```bash
# 1. 复制真实存档到临时目录（不动原目录）
robocopy "C:\Users\zhang\AppData\LocalLow\ChaosGalaxyStudio\Chaos Front" "C:\Users\zhang\AppData\Local\Temp\opencode\e2e_saves" /E
# 2. 应用中"选择存档目录"指向该副本
# 3. 依次执行: 载入槽0 → 资源拉满 → 全部+6 → 全部Lv10 → 全解锁 → 图鉴拉满 → 保存 → 保存图鉴
# 4. 校验脚本（node -e）读回 savedata0.cf:
#    PlayerUnits 全部 exp==unitMaxExp、PlayerCharacters 每项 exp==20000、
#    PlayerUnlockedUnitTypes==1..92、PlayerCredit 已改
# 5. collection.cf 校验 units 全 7、members 全 10
```

- [ ] **Step 3: 游戏内验证**

把 e2e 目录副本改回正式存档目录（先手动备份原档），启动游戏读取槽位：等级显示 +6 / Lv10、工厂可购全部机型、图鉴全亮。由用户确认。

- [ ] **Step 4: 提交最终 tag**

```bash
git tag v0.1.0
```

---

## 自审记录

- 规格覆盖：规格 §5 六模块 → Task 7-12；§4 架构 → Task 3/4/6；§3 素材 → Task 5；§6 错误处理 → files.ts 原子写 + SaveData.load 校验；§7 测试 → 各 TDD 任务 + Task 14；§8 发布 → Task 13 ✓
- 占位符：无 TBD/TODO；Tab 组件均给出完整代码 ✓
- 类型一致性：`SaveData` 方法名在 store/组件中引用一致（maxAllUnits/maxAllPilots/addUnit(gd,typeId,level)/removeUnit/setUnitExp/setPilotExp/unlockAllUnitTypes/unlockAllItems/maxCollection）✓
