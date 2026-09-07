<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { gameData } from '../../../common/gameData'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const unlocked = computed(() => new Set(store.save?.unlockedUnitTypes ?? []))
const unlockedItems = computed(() => new Set(store.save?.unlockedItems ?? []))

const groups = computed(() => [
  { title: '战舰', list: gameData.unitTypes.filter((t) => t.kind === 1) },
  { title: '大型机体', list: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 1) },
  { title: '小型机体', list: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 0) }
])

function toggleType(id: number, on: boolean): void {
  const arr = store.save!.unlockedUnitTypes
  const i = arr.indexOf(id)
  if (on && i < 0) arr.push(id)
  if (!on && i >= 0) arr.splice(i, 1)
  store.markDirty()
}
function selectAll(on: boolean): void {
  store.save!.setUnlockedUnitTypes(on ? gameData.unitTypes.map((t) => t.id) : [])
  store.markDirty()
  ElMessage.success(on ? '已解锁全部机型' : '已清空解锁')
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
  ElMessage.success('已解锁全部装备')
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="selectAll(true)">解锁全部机型</el-button>
      <el-button @click="selectAll(false)">全部取消</el-button>
      <el-divider direction="vertical" />
      <el-button @click="unlockAllItems()">解锁全部装备</el-button>
    </div>

    <div v-for="g in groups" :key="g.title" class="group">
      <h4>{{ g.title }}（{{ g.list.filter((t) => unlocked.has(t.id)).length }}/{{ g.list.length }}）</h4>
      <div class="grid">
        <div v-for="t in g.list" :key="t.id" class="cell" :class="{ on: unlocked.has(t.id) }" @click="toggleType(t.id, !unlocked.has(t.id))">
          <img :src="gameImage(`unit-${t.id}`)" />
          <span class="name">{{ t.name }}</span>
        </div>
      </div>
    </div>

    <div class="group">
      <h4>装备（{{ unlockedItems.size }}/{{ gameData.items.length }}）</h4>
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
