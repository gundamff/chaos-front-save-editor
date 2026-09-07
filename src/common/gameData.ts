import data from './data/game-data.json'
import { UNIT_MAX_LEVEL } from './level'

export interface UnitTypeEntry {
  id: number
  name: string
  kind: number
  size: number
  levelType: number
  model: number
}
export interface CharacterEntry {
  id: number
  name: string
  portrait: number
}
export interface ItemEntry {
  id: number
  name: string
  icon: number
}

export interface GameData {
  unitTypes: UnitTypeEntry[]
  characters: CharacterEntry[]
  items: ItemEntry[]
  levelTables: Record<string, number[]>
  unitMaxExp: Record<string, number>
}

/** 提取脚本产物（见 scripts/extract-game-data.mjs）；Task 7 前为占位空结构 */
export const gameData = data as GameData

export const ALL_UNIT_TYPE_IDS: number[] = gameData.unitTypes.map((u) => u.id)

export function unitTypeById(gd: GameData, id: number): UnitTypeEntry | undefined {
  return gd.unitTypes.find((u) => u.id === id)
}

export function characterById(gd: GameData, id: number): CharacterEntry | undefined {
  return gd.characters.find((c) => c.id === id)
}

export function itemById(gd: GameData, id: number): ItemEntry | undefined {
  return gd.items.find((i) => i.id === id)
}

export function levelTableOf(gd: GameData, levelType: number): number[] {
  return gd.levelTables[String(levelType)] ?? [0, 0, 0, 0, 0, 0, 0]
}

/** 机体经验上限：unitMaxExp 表优先；表外机型回落到各等级表 EXP6 的最大值（真实数据下即 UNIT_EXP6_FALLBACK） */
export function unitMaxExpOf(gd: GameData, unitTypeId: number): number {
  const v = gd.unitMaxExp[String(unitTypeId)]
  if (v !== undefined) return v
  let max = 0
  for (const table of Object.values(gd.levelTables)) {
    const exp6 = table[UNIT_MAX_LEVEL]
    if (typeof exp6 === 'number' && exp6 > max) max = exp6
  }
  return max
}
