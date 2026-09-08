<script setup lang="ts">
import { computed } from 'vue'
import { useSaveStore } from '../stores/saveStore'
import { armyById, gameData, planetById } from '../../../common/gameData'
import type { PlanetStatKey } from '../../../common/saveModel'
import { t } from '../i18n'

const store = useSaveStore()
const planets = computed(() => store.save?.planets ?? [])
const factions = computed(() => store.save?.factions ?? [])

const factionOptions = computed(() =>
  factions.value
    .filter((f) => f.id > 0)
    .map((f) => ({
      value: f.id,
      label: armyById(gameData, f.army)?.name ?? t('planets.factionFallback', f.id)
    }))
)

function planetName(id: number): string {
  return planetById(gameData, id)?.name ?? t('planets.planetFallback', id)
}

function wrap(fn: () => void): void {
  fn()
  store.markDirty()
}

function onStat(index: number, key: PlanetStatKey, v: number | undefined): void {
  if (v === undefined) return
  wrap(() => store.save!.setPlanetStat(index, key, v))
}

function onMax(index: number, key: PlanetStatKey, v: number | undefined): void {
  if (v === undefined) return
  wrap(() => store.save!.setPlanetMax(index, key, v))
}

function onFaction(index: number, v: number | undefined | null): void {
  if (v === undefined || v === null) return
  wrap(() => store.save!.setPlanetFaction(index, v))
}

function maxAllStats(): void {
  wrap(() => {
    planets.value.forEach((_, i) => {
      for (const key of ['economics', 'industry', 'defense', 'stability'] as PlanetStatKey[]) {
        const p = store.save!.planets[i]
        store.save!.setPlanetStat(i, key, p[`${key}Max`])
      }
    })
  })
}
</script>

<template>
  <div v-if="store.save">
    <el-alert type="warning" show-icon :closable="false" :title="t('planets.warn')" class="warn" />
    <div class="toolbar">
      <el-button type="primary" @click="maxAllStats()">{{ t('planets.maxAll') }}</el-button>
      <span class="count">{{ t('planets.count', planets.length) }}</span>
    </div>
    <el-table :data="planets" size="small" max-height="560">
      <el-table-column :label="t('planets.planet')" min-width="120">
        <template #default="{ row }">{{ planetName(row.id) }}</template>
      </el-table-column>
      <el-table-column :label="t('planets.faction')" min-width="180">
        <template #default="{ $index, row }">
          <el-select size="small" :model-value="row.faction" style="width: 100%" @change="(v) => onFaction($index, v)">
            <el-option v-for="o in factionOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column :label="t('planets.economics')" width="200">
        <template #default="{ $index, row }">
          <el-input-number size="small" :model-value="row.economics" :min="0" :max="row.economicsMax" controls-position="right" @change="(v) => onStat($index, 'economics', v)" />
          <span class="max">/ {{ row.economicsMax }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('planets.industry')" width="200">
        <template #default="{ $index, row }">
          <el-input-number size="small" :model-value="row.industry" :min="0" :max="row.industryMax" controls-position="right" @change="(v) => onStat($index, 'industry', v)" />
          <span class="max">/ {{ row.industryMax }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('planets.defense')" width="200">
        <template #default="{ $index, row }">
          <el-input-number size="small" :model-value="row.defense" :min="0" :max="row.defenseMax" controls-position="right" @change="(v) => onStat($index, 'defense', v)" />
          <span class="max">/ {{ row.defenseMax }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('planets.stability')" width="200">
        <template #default="{ $index, row }">
          <el-input-number size="small" :model-value="row.stability" :min="0" :max="row.stabilityMax" controls-position="right" @change="(v) => onStat($index, 'stability', v)" />
          <span class="max">/ {{ row.stabilityMax }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('planets.maxTune')" min-width="220">
        <template #default="{ $index, row }">
          <div class="max-edit">
            <span>{{ t('planets.econShort') }}</span>
            <el-input-number size="small" :model-value="row.economicsMax" :min="0" :max="9999" controls-position="right" @change="(v) => onMax($index, 'economics', v)" />
            <span>{{ t('planets.indShort') }}</span>
            <el-input-number size="small" :model-value="row.industryMax" :min="0" :max="9999" controls-position="right" @change="(v) => onMax($index, 'industry', v)" />
          </div>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.warn { margin-bottom: 12px; }
.toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 12px; }
.count { color: #909399; font-size: 13px; }
.max { margin-left: 4px; color: #909399; font-size: 12px; }
.max-edit { display: flex; gap: 4px; align-items: center; flex-wrap: wrap; }
</style>
