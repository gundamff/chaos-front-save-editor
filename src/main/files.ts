import fs from 'node:fs'
import path from 'node:path'
import type { BackupInfo, SlotInfo } from '../common/ipc'

const SLOT_COUNT = 6
const BACKUP_KEEP = 10

export async function defaultSaveDir(): Promise<string | null> {
  const { app } = await import('electron')
  const p = path.join(
    process.env.USERPROFILE ?? app.getPath('home'),
    'AppData',
    'LocalLow',
    'ChaosGalaxyStudio',
    'Chaos Front'
  )
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
  const files = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith(`${base}_`) && f.endsWith('.cf.bak'))
    .map((f) => ({ f, m: fs.statSync(path.join(backupDir, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m)
  for (const x of files.slice(keep)) fs.rmSync(path.join(backupDir, x.f))
}

export function listBackups(dir: string, slot: number): BackupInfo[] {
  const backupDir = path.join(dir, 'backup')
  const base = slotFileName(slot).replace('.cf', '')
  if (!fs.existsSync(backupDir)) return []
  return fs
    .readdirSync(backupDir)
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
  const { dialog } = await import('electron')
  const r = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  return r.canceled ? null : r.filePaths[0]
}
