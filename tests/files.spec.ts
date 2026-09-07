import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { pruneBackups, restoreBackup, summarize, writeSlotFile } from '../src/main/files'

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cfse-'))
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }))

const SLOT_SAMPLE = JSON.stringify({
  PlayerUnits: { __type: 'List', value: [{ unitType: 1 }, { unitType: 2 }] },
  PlayArmyName: { __type: 'string', value: '焰火团' },
  PlayerDay: { __type: 'int', value: 100 },
  RealTime: { __type: 'string', value: '2026/9/7' },
  PlayerLeaderName: { __type: 'string', value: '红玉' },
  PlayerFlag: { __type: 'int', value: 12 }
})

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

describe('summarize', () => {
  it('unwraps ES3 fields exactly once', () => {
    const s = summarize(SLOT_SAMPLE)
    expect(s.unitCount).toBe(2)
    expect(s.armyName).toBe('焰火团')
    expect(s.leaderName).toBe('红玉')
    expect(s.day).toBe(100)
    expect(s.saveTime).toBe('2026/9/7')
    expect(s.flag).toBe(12)
  })
})

describe('writeSlotFile', () => {
  it('rejects unparseable text and leaves the target unchanged', () => {
    const target = path.join(tmp, 'savedata0.cf')
    fs.writeFileSync(target, SLOT_SAMPLE, 'utf8')
    expect(() => writeSlotFile(tmp, 0, 'not json')).toThrow()
    expect(fs.readFileSync(target, 'utf8')).toBe(SLOT_SAMPLE)
  })
})

describe('restoreBackup', () => {
  it('backs up the current file before restoring the backup content', () => {
    const slot = 1
    const target = path.join(tmp, `savedata${slot}.cf`)
    fs.writeFileSync(target, 'CURRENT', 'utf8')
    const backupDir = path.join(tmp, 'backup')
    fs.mkdirSync(backupDir, { recursive: true })
    const old = path.join(backupDir, `savedata${slot}_20260101000000.cf.bak`)
    fs.writeFileSync(old, 'OLDER', 'utf8')
    restoreBackup(tmp, slot, path.basename(old))
    expect(fs.readFileSync(target, 'utf8')).toBe('OLDER')
    const created = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith(`savedata${slot}_`) && f.endsWith('.cf.bak') && f !== path.basename(old))
    expect(created).toHaveLength(1)
    expect(fs.readFileSync(path.join(backupDir, created[0]), 'utf8')).toBe('CURRENT')
  })
})
