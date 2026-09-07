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
