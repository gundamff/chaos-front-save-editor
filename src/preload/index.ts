import { contextBridge, ipcRenderer } from 'electron'
import type { SaveEditorApi } from '../common/ipc'

const api: SaveEditorApi = {
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  detectSaveDir: () => ipcRenderer.invoke('saves:detect'),
  chooseSaveDir: () => ipcRenderer.invoke('saves:choose'),
  listSlots: (dir) => ipcRenderer.invoke('saves:listSlots', dir),
  readSlot: (dir, slot) => ipcRenderer.invoke('saves:readSlot', dir, slot),
  writeSlot: (dir, slot, text) => ipcRenderer.invoke('saves:writeSlot', dir, slot, text),
  listBackups: (dir, slot) => ipcRenderer.invoke('saves:listBackups', dir, slot),
  restoreBackup: (dir, slot, name) => ipcRenderer.invoke('saves:restoreBackup', dir, slot, name),
  deleteBackup: (dir, name) => ipcRenderer.invoke('saves:deleteBackup', dir, name),
  readCollection: (dir) => ipcRenderer.invoke('saves:readCollection', dir),
  writeCollection: (dir, text) => ipcRenderer.invoke('saves:writeCollection', dir, text)
}

contextBridge.exposeInMainWorld('api', api)
