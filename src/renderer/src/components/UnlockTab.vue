<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { gameData } from '../../../common/gameData'
import { gameImage } from '../lib/images'
import { t } from '../i18n'

const store = useSaveStore()
const unlocked = computed(() => new Set(store.save?.unlockedUnitTypes ?? []))
const unlockedItems = computed(() => new Set(store.save?.unlockedItems ?? []))

const groups = computed(() => [
  { title: t('unlock.warships'), list: gameData.unitTypes.filter((u) => u.kind === 1) },
  { title: t('unlock.large'), list: gameData.unitTypes.filter((u) => u.kind === 2 && u.size === 1) },
  { title: t('unlock.small'), list: gameData.unitTypes.filter((u) => u.kind === 2 && u.size === 0) }
])

function toggleType(id: number, on: boolean): void {
  const arr = store.save!.unlockedUnitTypes
  const i = arr.indexOf(id)
  if (on && i < 0) arr.push(id)
  if (!on && i >= 0) arr.splice(i, 1)
  store.markDirty()
}
function selectAll(on: boolean): void {
  store.save!.setUnlockedUnitTypes(on ? gameData.unitTypes.map((u) => u.id) : [])
  store.markDirty()
  ElMessage.success(on ? t('unlock.unlockedAll') : t('unlock.cleared'))
}
function toggleItem(id: number, on: boolean): void {
  const arr = store.save!.unlockedItems
  const i = arr.indexOf(id)
  if (on && i < 0) arr.push(id)
  if (!on && i >= 0) arr.splice(i, 1)
  store.markDirty()
}
function unlockAllItems(): void {
  store.save!.unlockAllItems(gameData)
  store.markDirty()
  ElMessage.success(t('unlock.itemsUnlocked'))
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="selectAll(true)">{{ t('unlock.unlockAllTypes') }}</el-button>
      <el-button @click="selectAll(false)">{{ t('unlock.clearAll') }}</el-button>
      <el-divider direction="vertical" />
      <el-button @click="unlockAllItems()">{{ t('unlock.unlockAllItems') }}</el-button>
    </div>

    <div v-for="g in groups" :key="g.title" class="group">
      <h4>{{ g.title }}（{{ g.list.filter((u) => unlocked.has(u.id)).length }}/{{ g.list.length }}）</h4>
      <div class="grid">
        <div
          v-for="u in g.list"
          :key="u.id"
          class="cell"
          :class="{ on: unlocked.has(u.id) }"
          @click="toggleType(u.id, !unlocked.has(u.id))"
        >
          <img :src="gameImage(`unit-${u.id}`)" />
          <span class="name">{{ u.name }}</span>
        </div>
      </div>
    </div>

    <div class="group">
      <h4>{{ t('unlock.items', unlockedItems.size, gameData.items.length) }}</h4>
      <el-checkbox-group class="item-row" :model-value="[...unlockedItems]">
        <el-checkbox v-for="it in gameData.items" :key="it.id" :value="it.id" @change="(on: boolean) => toggleItem(it.id, on)">
          {{ it.name }}
        </el-checkbox>
      </el-checkbox-group>
    </div>
  </div>
</template>

<style scoped>
.toolbar { margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
.grid { display: flex; flex-wrap: wrap; gap: 8px; }
.cell { width: 88px; padding: 6px; border: 2px solid transparent; border-radius: 6px; text-align: center; cursor: pointer; opacity: 0.45; }
.cell:hover { background: #f5f7fa; }
.cell.on { opacity: 1; border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.cell img { width: 44px; image-rendering: pixelated; }
.name { display: block; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.item-row { display: flex; flex-wrap: wrap; gap: 4px 16px; }
</style>
