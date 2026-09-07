import { ElectronAPI } from '@electron-toolkit/preload'
import type { SaveEditorApi } from '../common/ipc'

declare global {
  interface Window {
    electron: ElectronAPI
    api: SaveEditorApi
  }
}

export {}
