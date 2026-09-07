import {
  ALL_UNIT_TYPE_IDS,
  levelTableOf,
  unitMaxExpOf,
  unitTypeById,
  type GameData
} from './gameData'
import { CHARACTER_MAX_EXP, unitLevelForExp } from './level'
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

  private num(key: string): number {
    return getField<number>(this.doc, key)
  }

  private setNum(key: string, v: number): void {
    setField(this.doc, key, Math.round(v))
  }

  get armyId(): number {
    return this.num('PlayerArmyId')
  }

  get armyName(): string {
    return getField<string>(this.doc, 'PlayArmyName')
  }

  get leaderName(): string {
    return getField<string>(this.doc, 'PlayerLeaderName')
  }

  get day(): number {
    return this.num('PlayerDay')
  }

  get saveTime(): string {
    return getField<string>(this.doc, 'RealTime')
  }

  get flag(): number {
    return this.num('PlayerFlag')
  }

  get star(): number {
    return this.num('PlayerStar')
  }

  setStar(v: number): void {
    this.setNum('PlayerStar', v)
  }

  get credit(): number {
    return this.num('PlayerCredit')
  }

  setCredit(v: number): void {
    this.setNum('PlayerCredit', v)
  }

  get prestige(): number {
    return this.num('PlayerPrestige')
  }

  setPrestige(v: number): void {
    this.setNum('PlayerPrestige', v)
  }

  get medals(): number[] {
    return getField<number[]>(this.doc, 'PlayerMedals')
  }

  setMedal(i: number, v: number): void {
    this.medals[i] = Math.round(v)
  }

  get relationships(): number[] {
    return getField<number[]>(this.doc, 'PlayerRelationships')
  }

  setRelationship(i: number, v: number): void {
    this.relationships[i] = Math.round(v)
  }

  docPlayerItems(): number[] {
    return getField<number[]>(this.doc, 'PlayerItems')
  }

  get units(): UnitEntry[] {
    return getField<UnitEntry[]>(this.doc, 'PlayerUnits')
  }

  setUnitExp(index: number, exp: number): void {
    this.units[index].exp = Math.max(0, Math.round(exp))
  }

  /** 全部机体拉满（按各机型 unitMaxExp），返回修改台数 */
  maxAllUnits(gd: GameData): number {
    let n = 0
    for (const u of this.units) {
      const target = unitMaxExpOf(gd, u.unitType)
      if (u.exp !== target) {
        u.exp = target
        n++
      }
    }
    return n
  }

  unitLevelOf(gd: GameData, unit: UnitEntry): number {
    const t = unitTypeById(gd, unit.unitType)
    return unitLevelForExp(unit.exp, levelTableOf(gd, t?.levelType ?? 12))
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
  addUnit(gd: GameData, unitTypeId: number, level: number): UnitEntry {
    const table = levelTableOf(gd, unitTypeById(gd, unitTypeId)?.levelType ?? 12)
    const lv = Math.min(Math.max(level, 0), 6)
    const u: UnitEntry = {
      unitType: unitTypeId,
      armyId: this.armyId,
      characterId: 0,
      items: [],
      custom: 0,
      number: [0, 0],
      exp: lv === 0 ? 0 : table[lv],
      playerName: ''
    }
    this.units.push(u)
    return u
  }

  get characters(): number[] {
    return getField<number[]>(this.doc, 'PlayerCharacters')
  }

  get characterExps(): number[] {
    return getField<number[]>(this.doc, 'PlayerCharacterEXPs')
  }

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

  get unlockedUnitTypes(): number[] {
    return getField<number[]>(this.doc, 'PlayerUnlockedUnitTypes')
  }

  setUnlockedUnitTypes(ids: number[]): void {
    setField(this.doc, 'PlayerUnlockedUnitTypes', [...ids])
  }

  unlockAllUnitTypes(): void {
    this.setUnlockedUnitTypes([...ALL_UNIT_TYPE_IDS])
  }

  get unlockedItems(): number[] {
    return getField<number[]>(this.doc, 'PlayerUnlockedItems')
  }

  setUnlockedItems(ids: number[]): void {
    setField(this.doc, 'PlayerUnlockedItems', [...ids])
  }

  unlockAllItems(gd: GameData): void {
    this.setUnlockedItems(gd.items.map((i) => i.id))
  }
}

export interface CollectionSnapshot {
  endings: boolean[]
  units: number[]
  members: number[]
}

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
