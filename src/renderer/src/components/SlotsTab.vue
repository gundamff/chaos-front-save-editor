<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSaveStore } from '../stores/saveStore'
import { gameImage } from '../lib/images'
import { t } from '../i18n'

const store = useSaveStore()
const backups = computed(() => store.backups)
onMounted(async () => {
  if (store.saveDir && store.slots.length === 0) await store.refreshSlots()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button @click="store.chooseDir()">{{ t('slots.chooseDir') }}</el-button>
      <el-button @click="store.refreshSlots()">{{ t('slots.refresh') }}</el-button>
    </div>
    <el-table :data="store.slots" highlight-current-row @current-change="(row) => row?.exists && store.loadSlot(row.slot)">
      <el-table-column :label="t('slots.slot')" width="70">
        <template #default="{ row }">{{ t('slots.slotN', row.slot) }}</template>
      </el-table-column>
      <el-table-column :label="t('slots.army')" min-width="140">
        <template #default="{ row }">
          <span v-if="row.exists"><img v-if="gameImage(`flag-round-${row.flag}`)" :src="gameImage(`flag-round-${row.flag}`)" class="flag" />{{ row.armyName }}</span>
          <el-tag v-else type="info">{{ t('slots.empty') }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="leaderName" :label="t('slots.leader')" width="110" />
      <el-table-column prop="day" :label="t('slots.day')" width="90" />
      <el-table-column prop="unitCount" :label="t('slots.unitCount')" width="80" />
      <el-table-column prop="saveTime" :label="t('slots.saveTime')" min-width="160" />
      <el-table-column :label="t('slots.actions')" width="110">
        <template #default="{ row }">
          <el-button size="small" type="primary" :disabled="!row.exists" @click="store.loadSlot(row.slot)">{{ t('slots.load') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <h4>{{ t('slots.backups', store.currentSlot ?? '-') }}</h4>
    <el-table :data="backups" max-height="240" size="small">
      <el-table-column prop="name" :label="t('slots.backupFile')" min-width="260" />
      <el-table-column :label="t('slots.time')" width="180">
        <template #default="{ row }">{{ new Date(row.mtimeMs).toLocaleString() }}</template>
      </el-table-column>
      <el-table-column :label="t('slots.actions')" width="180">
        <template #default="{ row }">
          <el-popconfirm :title="t('slots.restoreConfirm')" @confirm="store.restoreBackup(row.name)">
            <template #reference><el-button size="small">{{ t('slots.restore') }}</el-button></template>
          </el-popconfirm>
          <el-popconfirm :title="t('slots.deleteConfirm')" @confirm="store.deleteBackup(row.name)">
            <template #reference><el-button size="small" type="danger">{{ t('slots.delete') }}</el-button></template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.toolbar { margin-bottom: 12px; display: flex; gap: 8px; }
.flag { width: 20px; height: 20px; vertical-align: middle; margin-right: 6px; }
</style>
