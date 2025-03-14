<template>
  <div class="settings-container">
    <h2>系统设置</h2>

    <el-form
      :model="settings"
      label-width="120px"
      @submit.prevent="saveSettings"
    >
      <el-tabs>
        <el-tab-pane label="个性化">
          <el-form-item label="主题">
            <el-select v-model="settings.theme">
              <el-option label="浅色" value="light" />
              <el-option label="深色" value="dark" />
              <el-option label="跟随系统" value="auto" />
            </el-select>
          </el-form-item>

          <el-form-item label="主色调">
            <el-color-picker v-model="settings.primaryColor" />
          </el-form-item>

          <el-form-item label="字体大小">
            <el-slider
              v-model="settings.fontSize"
              :min="12"
              :max="20"
              :step="1"
            />
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane label="通知设置">
          <el-form-item label="任务提醒">
            <el-switch v-model="settings.notifications.tasks" />
          </el-form-item>

          <el-form-item label="日程提醒">
            <el-switch v-model="settings.notifications.schedule" />
          </el-form-item>

          <el-form-item label="提醒时间">
            <el-select v-model="settings.notifications.reminderTime">
              <el-option label="5分钟前" value="5" />
              <el-option label="15分钟前" value="15" />
              <el-option label="30分钟前" value="30" />
              <el-option label="1小时前" value="60" />
            </el-select>
          </el-form-item>
        </el-tab-pane>

        <el-tab-pane label="数据管理">
          <el-form-item label="自动备份">
            <el-switch v-model="settings.backup.enabled" />
          </el-form-item>

          <el-form-item label="备份频率">
            <el-select 
              v-model="settings.backup.frequency"
              :disabled="!settings.backup.enabled"
            >
              <el-option label="每天" value="daily" />
              <el-option label="每周" value="weekly" />
              <el-option label="每月" value="monthly" />
            </el-select>
          </el-form-item>

          <el-button type="primary" @click="exportData">
            导出所有数据
          </el-button>
        </el-tab-pane>
      </el-tabs>

      <div class="settings-actions">
        <el-button type="primary" @click="saveSettings" :loading="saving">
          保存设置
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/authStore'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const saving = ref(false)

const settings = reactive({
  theme: 'light',
  primaryColor: '#2A5CAA',
  fontSize: 14,
  notifications: {
    tasks: true,
    schedule: true,
    reminderTime: '15'
  },
  backup: {
    enabled: false,
    frequency: 'weekly'
  }
})

const saveSettings = async () => {
  saving.value = true
  try {
    await authStore.updateSettings(settings)
    ElMessage.success('设置已保存')
  } catch (error) {
    ElMessage.error('保存设置失败')
  } finally {
    saving.value = false
  }
}

const exportData = async () => {
  try {
    // 实现数据导出逻辑
  } catch (error) {
    ElMessage.error('导出失败')
  }
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.settings-actions {
  margin-top: 20px;
  text-align: right;
}
</style> 