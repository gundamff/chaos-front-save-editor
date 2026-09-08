<script setup lang="ts">
import { computed } from 'vue'
import { useSaveStore } from '../stores/saveStore'
import { gameData } from '../../../common/gameData'

const store = useSaveStore()
const save = computed(() => store.save)
const MAX_REL = 999

function wrap(fn: () => void): void {
  fn()
  store.markDirty()
}
function changeNum(apply: (v: number) => void): (v: number | undefined) => void {
  return (v) => {
    if (v === undefined) return
    wrap(() => apply(v))
  }
}
function maxResources(): void {
  wrap(() => {
    save.value!.setCredit(99_999_999)
    save.value!.setPrestige(99_999)
    save.value!.setStar(6)
  })
}
function medalLabel(i: number): string {
  return `勋章 · ${save.value!.factionLabel(gameData, i)}`
}
function relLabel(i: number): string {
  return `关系 · ${save.value!.factionLabel(gameData, i)}`
}
</script>

<template>
  <div v-if="save">
    <el-alert type="warning" show-icon :closable="false" title="关系值影响剧情走向，修改可能跳过/触发特定事件" class="warn" />
    <el-form label-width="220px" style="max-width: 640px">
      <el-form-item label="信用点"><el-input-number :model-value="save.credit" :min="0" :max="999999999" :step="10000" @change="changeNum((v) => save!.setCredit(v))" /></el-form-item>
      <el-form-item label="威望"><el-input-number :model-value="save.prestige" :min="0" :max="999999" :step="100" @change="changeNum((v) => save!.setPrestige(v))" /></el-form-item>
      <el-form-item label="星级"><el-input-number :model-value="save.star" :min="1" :max="6" @change="changeNum((v) => save!.setStar(v))" /></el-form-item>
      <el-form-item v-for="i in 4" :key="'medal' + i" :label="medalLabel(i - 1)">
        <el-input-number :model-value="save.medals[i - 1]" :min="0" :max="99999" @change="changeNum((v) => save!.setMedal(i - 1, v))" />
      </el-form-item>
      <el-form-item v-for="i in 4" :key="'rel' + i" :label="relLabel(i - 1)">
        <el-input-number :model-value="save.relationships[i - 1]" :min="0" :max="MAX_REL" @change="changeNum((v) => save!.setRelationship(i - 1, v))" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="maxResources()">一键拉满（信用/威望/星级）</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>.warn { margin-bottom: 16px; max-width: 640px; }</style>
