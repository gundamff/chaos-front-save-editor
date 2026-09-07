import type { SaveEditorApi } from '../common/ipc'

declare global {
  interface Window {
    api: SaveEditorApi
  }
}

export {}
