import { defineStore } from 'pinia'
import { ref, shallowRef, triggerRef, markRaw } from 'vue'
import { ElMessage } from 'element-plus'
import {
  SaveData,
  loadCollectionText,
  serializeCollectionText,
  type CollectionSnapshot
} from '../../../common/saveModel'
import type { GameData } from '../../../common/gameData'
import type { BackupInfo, SlotInfo, WriteResult } from '../../../common/ipc'
import { t, translateError } from '../i18n'

export const useSaveStore = defineStore('save', () => {
  const saveDir = ref('')
  const slots = ref<SlotInfo[]>([])
  const currentSlot = ref<number | null>(null)
  /** 类实例必须 shallowRef + markRaw，否则 Pinia/reactive 会弄丢原型方法 */
  const save = shallowRef<SaveData | null>(null)
  const collection = shallowRef<CollectionSnapshot | null>(null)
  const dirty = ref(false)
  const backups = ref<BackupInfo[]>([])

  function setSave(data: SaveData | null): void {
    save.value = data ? markRaw(data) : null
  }

  /** HMR 后旧实例可能仍挂着过期原型，装上/卸下前纠一次 */
  function api(): SaveData {
    const s = save.value
    if (!s) throw new Error('NO_SAVE')
    if (typeof s.equipItem !== 'function') {
      Object.setPrototypeOf(s, SaveData.prototype)
    }
    return s
  }

  function markDirty(): void {
    dirty.value = true
    if (save.value) triggerRef(save)
  }

  function equipItem(unitIndex: number, itemId: number, gd: GameData): void {
    api().equipItem(unitIndex, itemId, gd)
    markDirty()
  }

  function unequipItem(unitIndex: number, slot: number): void {
    api().unequipItem(unitIndex, slot)
    markDirty()
  }

  async function refreshSlots(): Promise<void> {
    slots.value = await window.api.listSlots(saveDir.value)
  }

  async function init(): Promise<void> {
    saveDir.value = (await window.api.detectSaveDir()) ?? ''
    if (saveDir.value) await refreshSlots()
  }

  async function chooseDir(): Promise<void> {
    const d = await window.api.chooseSaveDir()
    if (d) {
      saveDir.value = d
      await refreshSlots()
    }
  }

  async function loadSlot(slot: number): Promise<void> {
    try {
      const text = await window.api.readSlot(saveDir.value, slot)
      const data = SaveData.load(text)
      currentSlot.value = slot
      setSave(data)
      dirty.value = false
      try {
        collection.value = markRaw(loadCollectionText(await window.api.readCollection(saveDir.value)))
      } catch {
        collection.value = null
      }
      backups.value = await window.api.listBackups(saveDir.value, slot)
    } catch (e) {
      ElMessage.error(t('store.loadFail', e instanceof Error ? e.message : String(e)))
    }
  }

  async function saveSlot(): Promise<WriteResult | null> {
    if (!save.value || currentSlot.value === null) return null
    let text: string
    try {
      text = save.value.serialize()
    } catch (e) {
      return { ok: false, error: translateError(e) }
    }
    const r = await window.api.writeSlot(saveDir.value, currentSlot.value, text)
    if (r.ok) {
      dirty.value = false
      backups.value = await window.api.listBackups(saveDir.value, currentSlot.value)
      await refreshSlots()
    }
    return r
  }

  async function saveCollectionData(): Promise<WriteResult | null> {
    if (!collection.value) return null
    const r = await window.api.writeCollection(saveDir.value, serializeCollectionText(collection.value))
    return r
  }

  async function restoreBackup(name: string): Promise<void> {
    if (currentSlot.value === null) return
    const r = await window.api.restoreBackup(saveDir.value, currentSlot.value, name)
    if (r.ok) await loadSlot(currentSlot.value)
    else ElMessage.error(t('store.restoreFail', r.error ?? ''))
  }

  async function deleteBackup(name: string): Promise<void> {
    if (currentSlot.value === null) return
    const r = await window.api.deleteBackup(saveDir.value, name)
    if (r.ok) {
      backups.value = await window.api.listBackups(saveDir.value, currentSlot.value)
      ElMessage.success(t('store.backupDeleted'))
    } else {
      ElMessage.error(t('store.deleteFail', r.error ?? ''))
    }
  }

  return {
    saveDir,
    slots,
    currentSlot,
    save,
    collection,
    dirty,
    backups,
    markDirty,
    equipItem,
    unequipItem,
    refreshSlots,
    init,
    chooseDir,
    loadSlot,
    saveSlot,
    saveCollectionData,
    restoreBackup,
    deleteBackup
  }
})
