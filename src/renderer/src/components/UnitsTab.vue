<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { characterById, gameData, unitTypeById } from '../../../common/gameData'
import { unitLevelForExp } from '../../../common/level'
import type { UnitEntry } from '../../../common/saveModel'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const units = computed(() => store.save?.units ?? [])

function typeName(typeId: number): string {
  return unitTypeById(gameData, typeId)?.name ?? `未知机型#${typeId}`
}
function levelOf(u: { unitType: number; exp: number }): number {
  const lt = unitTypeById(gameData, u.unitType)?.levelType ?? 12
  return unitLevelForExp(u.exp, gameData.levelTables[String(lt)] ?? [])
}
function pilotName(id: number): string {
  return characterById(gameData, id)?.name ?? ''
}
function changed(u: UnitEntry, v: number | undefined): void {
  if (v === undefined || v === null) return
  store.save!.setUnitExp(units.value.indexOf(u), v)
  store.markDirty()
}
function maxAll(): void {
  const n = store.save!.maxAllUnits(gameData)
  store.markDirty()
  ElMessage.success(`已拉满 ${n} 台`)
}
function remove(index: number): void {
  store.save!.removeUnit(index)
  store.markDirty()
}

// 添加机体
const addVisible = ref(false)
const addType = ref<number | null>(null)
const addLevel = ref(6)
const groups = computed(() => [
  { title: '战舰', ids: gameData.unitTypes.filter((t) => t.kind === 1).map((t) => t.id) },
  { title: '大型机体', ids: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 1).map((t) => t.id) },
  { title: '小型机体', ids: gameData.unitTypes.filter((t) => t.kind === 2 && t.size === 0).map((t) => t.id) }
])
function confirmAdd(): void {
  if (!addType.value) return
  store.save!.addUnit(gameData, addType.value, addLevel.value)
  store.markDirty()
  addVisible.value = false
  ElMessage.success('已添加')
}
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button type="primary" @click="maxAll()">全部 +6</el-button>
      <el-button @click="addVisible = true">添加机体</el-button>
      <span class="count">共 {{ units.length }} 台</span>
    </div>
    <el-table :data="units" size="small" max-height="560">
      <el-table-column label="" width="56">
        <template #default="{ row }">
          <img :src="gameImage(`unit-${row.unitType}`)" class="unit-img" />
        </template>
      </el-table-column>
      <el-table-column label="名称" min-width="170">
        <template #default="{ row }">
          {{ typeName(row.unitType) }}<el-tag v-if="row.custom > 0" size="small" type="warning" style="margin-left: 6px">改装</el-tag>
          <el-tag size="small" style="margin-left: 6px">+{{ levelOf(row) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="驾驶员" width="120">
        <template #default="{ row }">
          <span v-if="row.characterId > 0">{{ pilotName(row.characterId) }}</span>
          <span v-else class="dim">—</span>
        </template>
      </el-table-column>
      <el-table-column label="经验" width="180">
        <template #default="{ row }">
          <el-input-number size="small" :model-value="row.exp" :min="0" :max="999999" :step="100" controls-position="right" @change="(v) => changed(row, v)" />
        </template>
      </el-table-column>
      <el-table-column label="装备" width="80">
        <template #default="{ row }">{{ row.items.filter((i) => i > 0).length }}</template>
      </el-table-column>
      <el-table-column label="操作" width="90">
        <template #default="{ row }">
          <el-popconfirm title="确认删除该机体？（装备归还仓库）" @confirm="remove(units.indexOf(row))">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="addVisible" title="添加机体" width="560">
      <el-form label-width="90px">
        <el-form-item label="型号">
          <el-select v-model="addType" filterable placeholder="选择型号（可搜索）" style="width: 100%">
            <el-option-group v-for="g in groups" :key="g.title" :label="g.title">
              <el-option v-for="id in g.ids" :key="id" :value="id" :label="typeName(id)" />
            </el-option-group>
          </el-select>
        </el-form-item>
        <el-form-item label="初始等级">
          <el-slider v-model="addLevel" :min="0" :max="6" show-stops style="width: 300px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!addType" @click="confirmAdd()">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; }
.count { color: #909399; }
.unit-img { width: 40px; image-rendering: pixelated; }
.dim { color: #c0c4cc; }
</style>
