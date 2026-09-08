<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { characterById, gameData, unitTypeById } from '../../../common/gameData'
import { FORMATION_COLS, FORMATION_ROWS } from '../../../common/saveModel'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const selectedUnit = ref<number | null>(null)
const selectedCell = ref<{ row: number; col: number } | null>(null)

const units = computed(() => store.save?.units ?? [])
const characters = computed(() => store.save?.characters ?? [])

const rows = Array.from({ length: FORMATION_ROWS }, (_, i) => i + 1)
const cols = Array.from({ length: FORMATION_COLS }, (_, i) => i)

const undeployed = computed(() =>
  units.value
    .map((u, index) => ({ u, index }))
    .filter(({ u }) => store.save!.isUndeployed(u))
)

const pilotOptions = computed(() => [
  { value: 0, label: '（无驾驶员）' },
  ...characters.value.map((id) => ({
    value: id,
    label: characterById(gameData, id)?.name ?? `#${id}`
  }))
])

function typeName(typeId: number): string {
  return unitTypeById(gameData, typeId)?.name ?? `#${typeId}`
}
function pilotName(id: number): string {
  if (!id) return '—'
  return characterById(gameData, id)?.name ?? `#${id}`
}
function wrap(fn: () => void): void {
  try {
    fn()
    store.markDirty()
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : String(e))
  }
}

function cellUnitIndex(row: number, col: number): number {
  return store.save?.unitAt(row, col) ?? -1
}

function selectUnit(index: number): void {
  selectedUnit.value = index
  selectedCell.value = null
}

function onCellClick(row: number, col: number): void {
  if (!store.save) return
  const idx = cellUnitIndex(row, col)
  if (selectedUnit.value !== null) {
    const from = selectedUnit.value
    wrap(() => store.save!.deployUnit(from, row, col))
    selectedUnit.value = null
    selectedCell.value = { row, col }
    return
  }
  if (idx >= 0) {
    selectedUnit.value = idx
    selectedCell.value = { row, col }
  } else {
    selectedCell.value = { row, col }
  }
}

function undeploySelected(): void {
  if (selectedUnit.value === null) return
  wrap(() => store.save!.undeployUnit(selectedUnit.value!))
  selectedCell.value = null
}

function setPilot(characterId: number | undefined | null): void {
  if (selectedUnit.value === null || characterId === undefined || characterId === null) return
  wrap(() => store.save!.setUnitPilot(selectedUnit.value!, characterId))
}

const selected = computed(() =>
  selectedUnit.value === null ? null : units.value[selectedUnit.value] ?? null
)
</script>

<template>
  <div v-if="store.save" class="formation">
    <el-alert
      type="info"
      show-icon
      :closable="false"
      title="先点选机体（网格或未上阵列表），再点目标格子上阵/换位；同一驾驶员不能开两台机"
      class="hint"
    />

    <div class="toolbar">
      <el-button :disabled="selectedUnit === null || (selected && store.save.isUndeployed(selected))" @click="undeploySelected()">
        下阵选中
      </el-button>
      <span v-if="selectedUnit !== null" class="sel">
        已选：{{ typeName(selected!.unitType) }} · {{ pilotName(selected!.characterId) }}
        <template v-if="!store.save.isUndeployed(selected!)">（{{ selected!.number[0] }},{{ selected!.number[1] }}）</template>
      </span>
      <el-select
        v-if="selectedUnit !== null"
        size="small"
        style="width: 180px"
        :model-value="selected!.characterId"
        placeholder="驾驶员"
        @change="setPilot"
      >
        <el-option v-for="o in pilotOptions" :key="o.value" :label="o.label" :value="o.value" />
      </el-select>
    </div>

    <div class="grid-wrap">
      <div class="col-head">
        <span class="corner" />
        <span v-for="c in cols" :key="'h' + c" class="col-label">列 {{ c }}</span>
      </div>
      <div v-for="r in rows" :key="'r' + r" class="grid-row">
        <span class="row-label">行 {{ r }}</span>
        <button
          v-for="c in cols"
          :key="r + '-' + c"
          type="button"
          class="cell"
          :class="{
            filled: cellUnitIndex(r, c) >= 0,
            active: selectedCell?.row === r && selectedCell?.col === c,
            pick: selectedUnit !== null && cellUnitIndex(r, c) === selectedUnit
          }"
          @click="onCellClick(r, c)"
        >
          <template v-if="cellUnitIndex(r, c) >= 0">
            <img :src="gameImage(`unit-${units[cellUnitIndex(r, c)].unitType}`)" class="unit-img" />
            <div class="name">{{ typeName(units[cellUnitIndex(r, c)].unitType) }}</div>
            <div class="pilot">
              <img
                v-if="units[cellUnitIndex(r, c)].characterId"
                :src="gameImage(`portrait-${units[cellUnitIndex(r, c)].characterId}`)"
                class="portrait"
              />
              {{ pilotName(units[cellUnitIndex(r, c)].characterId) }}
            </div>
          </template>
          <span v-else class="empty">空</span>
        </button>
      </div>
    </div>

    <h4>未上阵（{{ undeployed.length }}）</h4>
    <div class="bench">
      <button
        v-for="{ u, index } in undeployed"
        :key="'b' + index"
        type="button"
        class="bench-item"
        :class="{ pick: selectedUnit === index }"
        @click="selectUnit(index)"
      >
        <img :src="gameImage(`unit-${u.unitType}`)" class="unit-img" />
        <div>
          <div class="name">{{ typeName(u.unitType) }}</div>
          <div class="pilot">{{ pilotName(u.characterId) }}</div>
        </div>
      </button>
      <span v-if="!undeployed.length" class="dim">全部已上阵</span>
    </div>
  </div>
</template>

<style scoped>
.hint { margin-bottom: 12px; }
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
.sel { font-size: 13px; color: #606266; }
.grid-wrap { display: inline-block; margin-bottom: 16px; }
.col-head, .grid-row { display: flex; align-items: stretch; }
.corner, .row-label { width: 48px; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #909399; }
.col-label { width: 112px; text-align: center; font-size: 12px; color: #909399; padding: 4px 0; }
.cell {
  width: 112px; min-height: 96px; margin: 3px; padding: 6px; border: 1px dashed #dcdfe6; border-radius: 6px;
  background: #fafafa; cursor: pointer; text-align: left; vertical-align: top;
}
.cell.filled { border-style: solid; background: #fff; }
.cell.active, .cell.pick, .bench-item.pick { border-color: #409eff; box-shadow: 0 0 0 1px #409eff inset; }
.cell:hover, .bench-item:hover { border-color: #79bbff; }
.unit-img { width: 36px; height: 36px; image-rendering: pixelated; display: block; }
.portrait { width: 16px; height: 16px; image-rendering: pixelated; vertical-align: middle; margin-right: 2px; }
.name { font-size: 12px; font-weight: 600; margin-top: 4px; line-height: 1.2; }
.pilot { font-size: 11px; color: #909399; margin-top: 2px; }
.empty { color: #c0c4cc; font-size: 12px; }
.bench { display: flex; flex-wrap: wrap; gap: 8px; }
.bench-item {
  display: flex; gap: 8px; align-items: center; min-width: 160px; padding: 8px; border: 1px solid #e4e7ed;
  border-radius: 6px; background: #fff; cursor: pointer; text-align: left;
}
.dim { color: #c0c4cc; }
h4 { margin: 8px 0 10px; font-size: 14px; }
</style>
