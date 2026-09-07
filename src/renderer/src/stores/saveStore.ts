import { defineStore } from 'pinia'
import { ref } from 'vue'
import { SaveData, loadCollectionText, serializeCollectionText, type CollectionSnapshot } from '../../../common/saveModel'
import type { BackupInfo, SlotInfo, WriteResult } from '../../../common/ipc'

export const useSaveStore = defineStore('save', () => {
  const saveDir = ref('')
  const slots = ref<SlotInfo[]>([])
  const currentSlot = ref<number | null>(null)
  const save = ref<SaveData | null>(null)
  const collection = ref<CollectionSnapshot | null>(null)
  const dirty = ref(false)
  const backups = ref<BackupInfo[]>([])

  function markDirty(): void {
    dirty.value = true
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
    const text = await window.api.readSlot(saveDir.value, slot)
    save.value = SaveData.load(text)
    currentSlot.value = slot
    dirty.value = false
    try {
      collection.value = loadCollectionText(await window.api.readCollection(saveDir.value))
    } catch {
      collection.value = null
    }
    backups.value = await window.api.listBackups(saveDir.value, slot)
  }

  async function saveSlot(): Promise<WriteResult | null> {
    if (!save.value || currentSlot.value === null) return null
    const r = await window.api.writeSlot(saveDir.value, currentSlot.value, save.value.serialize())
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
    refreshSlots,
    init,
    chooseDir,
    loadSlot,
    saveSlot,
    saveCollectionData,
    restoreBackup
  }
})
