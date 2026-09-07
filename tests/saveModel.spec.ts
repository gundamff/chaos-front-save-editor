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

const fixture = (): string => readFileSync(join(__dirname, 'fixtures/minimal-save.json'), 'utf8')

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
    expect(s2.units[0].exp).toBe(5320) // unitType 5 -> levelType 6 表 EXP6
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
    Endings: {
      __type: 'System.Boolean[],mscorlib',
      value: [true, false, false, false, false, false, false, false]
    },
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
