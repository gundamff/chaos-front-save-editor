<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { characterById, gameData } from '../../../common/gameData'
import { CHARACTER_MAX_EXP, characterLevelForExp } from '../../../common/level'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const pilots = computed(() =>
  (store.save?.characters ?? []).map((id, index) => ({
    id,
    index,
    name: characterById(gameData, id)?.name ?? `#${id}`,
    exp: store.save!.characterExps[index] ?? 0
  }))
)

function levelOf(exp: number): number {
  return characterLevelForExp(exp)
}
function setExp(index: number, v: number | undefined): void {
  if (v === undefined || v === null) return
  store.save!.setPilotExp(index, v)
  store.markDirty()
}
function maxAll(): void {
  const n = store.save!.maxAllPilots()
  store.markDirty()
  ElMessage.success(`已满级 ${n} 人`)
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="maxAll()">全部 Lv10</el-button>
      <span class="count">共 {{ pilots.length }} 人</span>
    </div>
    <el-table :data="pilots" size="small" max-height="560">
      <el-table-column label="头像" width="64">
        <template #default="{ row }">
          <img :src="gameImage(`portrait-${row.id}`)" class="avatar" />
        </template>
      </el-table-column>
      <el-table-column prop="name" label="姓名" min-width="120" />
      <el-table-column label="等级" width="90">
        <template #default="{ row }"><el-tag>Lv{{ levelOf(row.exp) }}</el-tag></template>
      </el-table-column>
      <el-table-column label="经验" width="220">
        <template #default="{ row }">
          <el-input-number size="small" :model-value="row.exp" :min="0" :max="999999" :step="100" controls-position="right" @change="(v) => setExp(row.index, v)" />
        </template>
      </el-table-column>
      <el-table-column label="进度">
        <template #default="{ row }">
          <el-progress :percentage="Math.min(100, Math.round((row.exp / CHARACTER_MAX_EXP) * 100))" :stroke-width="10" />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.count { color: #909399; }
.avatar { width: 44px; height: 44px; object-fit: cover; }
</style>
