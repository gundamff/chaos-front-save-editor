<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useSaveStore } from './stores/saveStore'
import SlotsTab from './components/SlotsTab.vue'
import ResourcesTab from './components/ResourcesTab.vue'
import UnitsTab from './components/UnitsTab.vue'
import PilotsTab from './components/PilotsTab.vue'
import UnlockTab from './components/UnlockTab.vue'
import CollectionTab from './components/CollectionTab.vue'
import PlanetsTab from './components/PlanetsTab.vue'
import FormationTab from './components/FormationTab.vue'

const store = useSaveStore()
const tab = ref('slots')

onMounted(() => store.init())

async function saveAll(): Promise<void> {
  const r = await store.saveSlot()
  if (!r) return
  r.ok ? ElMessage.success(`已保存（备份 ${r.backup}）`) : ElMessage.error(r.error)
}
</script>

<template>
  <el-container class="root">
    <el-header class="header">
      <span class="title">Chaos Front 存档修改器</span>
      <span class="dir">{{ store.saveDir || '未找到存档目录' }}</span>
      <el-button v-if="store.save" type="primary" :disabled="!store.dirty" @click="saveAll">
        保存到存档{{ store.dirty ? '（有未保存更改）' : '' }}
      </el-button>
    </el-header>
    <el-main>
      <el-alert v-if="!store.saveDir" type="warning" title="未自动找到存档目录，请手动选择" :closable="false" show-icon />
      <el-tabs v-model="tab">
        <el-tab-pane label="存档" name="slots"><SlotsTab /></el-tab-pane>
        <el-tab-pane label="资源" name="resources" :disabled="!store.save"><ResourcesTab /></el-tab-pane>
        <el-tab-pane label="星球" name="planets" :disabled="!store.save"><PlanetsTab /></el-tab-pane>
        <el-tab-pane label="编队" name="formation" :disabled="!store.save"><FormationTab /></el-tab-pane>
        <el-tab-pane label="机体 / 飞船" name="units" :disabled="!store.save"><UnitsTab /></el-tab-pane>
        <el-tab-pane label="驾驶员" name="pilots" :disabled="!store.save"><PilotsTab /></el-tab-pane>
        <el-tab-pane label="全解锁" name="unlock" :disabled="!store.save"><UnlockTab /></el-tab-pane>
        <el-tab-pane label="图鉴" name="collection" :disabled="!store.collection"><CollectionTab /></el-tab-pane>
      </el-tabs>
    </el-main>
  </el-container>
</template>

<style scoped>
.root { height: 100vh; }
.header { display: flex; align-items: center; gap: 16px; }
.title { font-weight: 700; font-size: 18px; }
.dir { flex: 1; color: #909399; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
