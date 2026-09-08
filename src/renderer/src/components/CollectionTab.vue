<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { maxCollection } from '../../../common/saveModel'
import { t } from '../i18n'

const store = useSaveStore()
const col = computed(() => store.collection)
const endingsCount = computed(() => col.value?.endings.filter(Boolean).length ?? 0)

function maxAll(): void {
  maxCollection(col.value!)
  store.markDirty()
  ElMessage.success(t('collection.maxed'))
}
async function saveCol(): Promise<void> {
  const r = await store.saveCollectionData()
  if (r) r.ok ? ElMessage.success(t('collection.saved', r.backup ?? '')) : ElMessage.error(r.error)
}
</script>

<template>
  <div v-if="col">
    <div class="toolbar">
      <el-button type="primary" @click="maxAll()">{{ t('collection.maxAll') }}</el-button>
      <el-button type="success" @click="saveCol()">{{ t('collection.saveFile') }}</el-button>
      <span class="count">{{ t('collection.endingsCount', endingsCount, col.endings.length) }}</span>
    </div>
    <el-alert type="info" show-icon :closable="false" :title="t('collection.warn')" class="warn" />
    <h4>{{ t('collection.endings') }}</h4>
    <el-checkbox-group :model-value="col.endings.map((v, i) => (v ? i : -1)).filter((i) => i >= 0)">
      <el-checkbox
        v-for="(_, i) in col.endings"
        :key="i"
        :value="i"
        :label="t('collection.endingN', i + 1)"
        @change="(on: boolean) => { col!.endings[i] = on; store.markDirty() }"
      />
    </el-checkbox-group>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.count { color: #909399; }
.warn { margin-bottom: 12px; max-width: 640px; }
</style>
