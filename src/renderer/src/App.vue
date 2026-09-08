<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { GITHUB_REPO_URL } from '../../common/ipc'
import { useSaveStore } from './stores/saveStore'
import SlotsTab from './components/SlotsTab.vue'
import ResourcesTab from './components/ResourcesTab.vue'
import UnitsTab from './components/UnitsTab.vue'
import PilotsTab from './components/PilotsTab.vue'
import UnlockTab from './components/UnlockTab.vue'
import CollectionTab from './components/CollectionTab.vue'
import PlanetsTab from './components/PlanetsTab.vue'
import FormationTab from './components/FormationTab.vue'
import { elementLocale, locale, setLocale, t, type AppLocale } from './i18n'

const store = useSaveStore()
const tab = ref('slots')
const aboutVisible = ref(false)
const appVersion = ref('')

onMounted(async () => {
  store.init()
  appVersion.value = await window.api.getAppVersion()
})

async function saveAll(): Promise<void> {
  const r = await store.saveSlot()
  if (!r) return
  r.ok ? ElMessage.success(t('app.saved', r.backup ?? '')) : ElMessage.error(r.error)
}

function switchLang(next: AppLocale): void {
  setLocale(next)
}

async function openGithub(): Promise<void> {
  await window.api.openExternal(GITHUB_REPO_URL)
}
</script>

<template>
  <el-config-provider :locale="elementLocale">
    <el-container class="root">
      <el-header class="header">
        <span class="title">{{ t('app.title') }}</span>
        <span class="dir">{{ store.saveDir || t('app.noDir') }}</span>
        <span class="lang">
          <button type="button" class="lang-btn" :class="{ on: locale === 'zh' }" @click="switchLang('zh')">
            {{ t('app.langZh') }}
          </button>
          <span class="sep">|</span>
          <button type="button" class="lang-btn" :class="{ on: locale === 'en' }" @click="switchLang('en')">
            {{ t('app.langEn') }}
          </button>
        </span>
        <el-button text @click="aboutVisible = true">{{ t('app.about') }}</el-button>
        <el-button v-if="store.save" type="primary" :disabled="!store.dirty" @click="saveAll">
          {{ store.dirty ? t('app.saveDirty') : t('app.save') }}
        </el-button>
      </el-header>
      <el-dialog v-model="aboutVisible" :title="t('about.title')" width="480" destroy-on-close>
        <p class="about-name">{{ t('app.title') }}</p>
        <p class="about-meta">{{ t('about.version', appVersion || '—') }}</p>
        <p class="about-meta">
          <el-link type="primary" @click="openGithub">{{ t('about.github') }}</el-link>
        </p>
        <p class="about-url">{{ GITHUB_REPO_URL }}</p>
        <p class="about-disclaimer">{{ t('about.disclaimer') }}</p>
      </el-dialog>
      <el-main>
        <el-alert
          v-if="!store.saveDir"
          type="warning"
          :title="t('app.pickDirAlert')"
          :closable="false"
          show-icon
        />
        <el-tabs v-model="tab">
          <el-tab-pane :label="t('tabs.slots')" name="slots"><SlotsTab /></el-tab-pane>
          <el-tab-pane :label="t('tabs.resources')" name="resources" :disabled="!store.save"><ResourcesTab /></el-tab-pane>
          <el-tab-pane :label="t('tabs.planets')" name="planets" :disabled="!store.save"><PlanetsTab /></el-tab-pane>
          <el-tab-pane :label="t('tabs.formation')" name="formation" :disabled="!store.save"><FormationTab /></el-tab-pane>
          <el-tab-pane :label="t('tabs.units')" name="units" :disabled="!store.save"><UnitsTab /></el-tab-pane>
          <el-tab-pane :label="t('tabs.pilots')" name="pilots" :disabled="!store.save"><PilotsTab /></el-tab-pane>
          <el-tab-pane :label="t('tabs.unlock')" name="unlock" :disabled="!store.save"><UnlockTab /></el-tab-pane>
          <el-tab-pane :label="t('tabs.collection')" name="collection" :disabled="!store.collection"><CollectionTab /></el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container>
  </el-config-provider>
</template>

<style scoped>
.root { height: 100vh; }
.header { display: flex; align-items: center; gap: 16px; }
.title { font-weight: 700; font-size: 18px; }
.dir { flex: 1; color: #909399; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.lang { display: flex; align-items: center; gap: 6px; font-size: 13px; flex-shrink: 0; }
.lang-btn {
  border: none; background: transparent; cursor: pointer; color: #909399; padding: 0;
}
.lang-btn.on { color: #409eff; font-weight: 600; }
.sep { color: #dcdfe6; }
.about-name { font-weight: 700; font-size: 16px; margin: 0 0 8px; }
.about-meta { margin: 0 0 8px; }
.about-url { margin: 0 0 12px; font-size: 12px; color: #909399; word-break: break-all; }
.about-disclaimer { margin: 0; font-size: 13px; color: #606266; line-height: 1.5; }
</style>
