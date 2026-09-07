<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useSaveStore } from '../stores/saveStore'
import { gameImage } from '../lib/images'

const store = useSaveStore()
const backups = computed(() => store.backups)
onMounted(async () => {
  if (store.saveDir && store.slots.length === 0) await store.refreshSlots()
})
</script>

<template>
  <div>
    <div class="toolbar">
      <el-button @click="store.chooseDir()">选择存档目录</el-button>
      <el-button @click="store.refreshSlots()">刷新</el-button>
    </div>
    <el-table :data="store.slots" highlight-current-row @current-change="(row) => row?.exists && store.loadSlot(row.slot)">
      <el-table-column label="槽位" width="70">
        <template #default="{ row }">槽 {{ row.slot }}</template>
      </el-table-column>
      <el-table-column label="军团" min-width="140">
        <template #default="{ row }">
          <span v-if="row.exists"><img v-if="gameImage(`flag-round-${row.flag}`)" :src="gameImage(`flag-round-${row.flag}`)" class="flag" />{{ row.armyName }}</span>
          <el-tag v-else type="info">空</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="leaderName" label="指挥官" width="110" />
      <el-table-column prop="day" label="天数" width="90" />
      <el-table-column prop="unitCount" label="机体数" width="80" />
      <el-table-column prop="saveTime" label="保存时间" min-width="160" />
      <el-table-column label="操作" width="110">
        <template #default="{ row }">
          <el-button size="small" type="primary" :disabled="!row.exists" @click="store.loadSlot(row.slot)">载入</el-button>
        </template>
      </el-table-column>
    </el-table>

    <h4>备份还原（当前槽 {{ store.currentSlot ?? '-' }}）</h4>
    <el-table :data="backups" max-height="240" size="small">
      <el-table-column prop="name" label="备份文件" min-width="260" />
      <el-table-column label="时间" width="180">
        <template #default="{ row }">{{ new Date(row.mtimeMs).toLocaleString('zh-CN') }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180">
        <template #default="{ row }">
          <el-popconfirm title="确认还原该备份？当前文件将先自动备份" @confirm="store.restoreBackup(row.name)">
            <template #reference><el-button size="small">还原</el-button></template>
          </el-popconfirm>
          <el-popconfirm title="确认删除该备份？不可恢复" @confirm="store.deleteBackup(row.name)">
            <template #reference><el-button size="small" type="danger">删除</el-button></template>
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
