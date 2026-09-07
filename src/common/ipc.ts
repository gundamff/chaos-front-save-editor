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

export interface SaveEditorApi {
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
