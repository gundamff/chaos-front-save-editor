<script setup lang="ts">
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from '../stores/saveStore'
import { maxCollection } from '../../../common/saveModel'

const store = useSaveStore()
const col = computed(() => store.collection)
const endingsCount = computed(() => col.value?.endings.filter(Boolean).length ?? 0)

function maxAll(): void {
  maxCollection(col.value!)
  store.markDirty()
  ElMessage.success('图鉴已拉满（记得点保存）')
}
async function saveCol(): Promise<void> {
  const r = await store.saveCollectionData()
  if (r) r.ok ? ElMessage.success(`图鉴已写入（备份 ${r.backup}）`) : ElMessage.error(r.error)
}
</script>

<template>
  <div v-if="col">
    <div class="toolbar">
      <el-button type="primary" @click="maxAll()">一键拉满（结局 + 收藏度）</el-button>
      <el-button type="success" @click="saveCol()">保存图鉴文件</el-button>
      <span class="count">结局 {{ endingsCount }}/{{ col.endings.length }}</span>
    </div>
    <el-alert type="info" show-icon :closable="false"
      title="图鉴写入独立文件 collection.cf，与存档槽互不影响；机体收藏拉满为+6、成员拉满为Lv10" class="warn" />
    <h4>结局</h4>
    <el-checkbox-group :model-value="col.endings.map((v, i) => (v ? i : -1)).filter((i) => i >= 0)">
      <el-checkbox v-for="(_, i) in col.endings" :key="i" :value="i" :label="`结局 ${i + 1}`" @change="(on: boolean) => { col!.endings[i] = on; store.markDirty() }" />
    </el-checkbox-group>
  </div>
</template>

<style scoped>
.toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 12px; }
.count { color: #909399; }
.warn { margin-bottom: 12px; max-width: 640px; }
</style>
