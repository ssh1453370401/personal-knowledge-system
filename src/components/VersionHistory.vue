<template>
  <div class="version-history">
    <div class="version-header">
      <h3>版本历史</h3>
    </div>

    <el-timeline>
      <el-timeline-item
        v-for="version in versions"
        :key="version.id"
        :timestamp="formatDate(version.createdAt)"
        placement="top"
      >
        <el-card>
          <template #header>
            <div class="version-card-header">
              <span>版本 {{ version.id }}</span>
              <div class="version-actions">
                <el-button 
                  type="primary" 
                  link
                  @click="restoreVersion(version)"
                >
                  还原此版本
                </el-button>
                <el-button 
                  type="primary" 
                  link
                  @click="viewDiff(version)"
                >
                  查看差异
                </el-button>
              </div>
            </div>
          </template>
          <div class="version-content">
            <p>{{ getVersionSummary(version) }}</p>
          </div>
        </el-card>
      </el-timeline-item>
    </el-timeline>

    <el-dialog
      v-model="diffDialogVisible"
      title="版本差异"
      width="70%"
    >
      <div class="diff-view" v-if="selectedVersion">
        <!-- 这里可以使用 diff 库来显示差异 -->
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  contentId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  }
})

const versions = ref([])
const diffDialogVisible = ref(false)
const selectedVersion = ref(null)

const fetchVersions = async () => {
  try {
    const response = await fetch(`/api/versions?id=${props.contentId}`)
    versions.value = await response.json()
  } catch (error) {
    ElMessage.error('获取版本历史失败')
  }
}

const formatDate = (date) => {
  return new Date(date).toLocaleString()
}

const getVersionSummary = (version) => {
  // 这里可以实现版本变更摘要的逻辑
  return `更新于 ${formatDate(version.createdAt)}`
}

const restoreVersion = async (version) => {
  try {
    await fetch(`/api/versions/restore`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ versionId: version.id })
    })
    ElMessage.success('版本还原成功')
  } catch (error) {
    ElMessage.error('版本还原失败')
  }
}

const viewDiff = (version) => {
  selectedVersion.value = version
  diffDialogVisible.value = true
}

onMounted(fetchVersions)
</script>

<style scoped>
.version-history {
  padding: 16px;
}

.version-header {
  margin-bottom: 20px;
}

.version-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.version-actions {
  display: flex;
  gap: 8px;
}

.version-content {
  color: #666;
}

.diff-view {
  max-height: 500px;
  overflow-y: auto;
}
</style> 