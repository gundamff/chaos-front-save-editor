import { describe, expect, it } from 'vitest'
import {
  getField,
  isWrapped,
  parseEs3,
  setField,
  stringifyEs3,
  type Es3Doc
} from '../src/common/es3'

const SAMPLE = JSON.stringify({
  PlayerCredit: { __type: 'int', value: 9788541 },
  PlayerUnits: {
    __type: 'System.Collections.Generic.List`1[[Unit, Assembly-CSharp]],mscorlib',
    value: [
      {
        unitType: 5,
        armyId: 12,
        characterId: 0,
        items: [],
        custom: 0,
        number: [0, 0],
        exp: 7498,
        playerName: ''
      }
    ]
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
