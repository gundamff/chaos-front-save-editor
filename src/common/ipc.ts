export interface SlotInfo {
  slot: number
  exists: boolean
  armyName?: string
  leaderName?: string
  day?: number
  saveTime?: string
  unitCount?: number
  flag?: number
}
export interface BackupInfo {
  name: string
  mtimeMs: number
  size: number
}
export interface WriteResult {
  ok: boolean
  error?: string
  backup?: string
}

export const GITHUB_REPO_URL = 'https://github.com/gundamff/chaos-front-save-editor'

export interface SaveEditorApi {
  getAppVersion(): Promise<string>
  openExternal(url: string): Promise<boolean>
  detectSaveDir(): Promise<string | null>
  chooseSaveDir(): Promise<string | null>
  listSlots(dir: string): Promise<SlotInfo[]>
  readSlot(dir: string, slot: number): Promise<string>
  writeSlot(dir: string, slot: number, text: string): Promise<WriteResult>
  listBackups(dir: string, slot: number): Promise<BackupInfo[]>
  restoreBackup(dir: string, slot: number, name: string): Promise<WriteResult>
  deleteBackup(dir: string, name: string): Promise<WriteResult>
  readCollection(dir: string): Promise<string>
  writeCollection(dir: string, text: string): Promise<WriteResult>
}
