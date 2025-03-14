<template>
  <div class="resource-list">
    <div class="list-header">
      <div class="view-controls">
        <el-radio-group v-model="viewMode" size="small">
          <el-radio-button label="grid">
            <el-icon><Grid /></el-icon>
          </el-radio-button>
          <el-radio-button label="list">
            <el-icon><List /></el-icon>
          </el-radio-button>
        </el-radio-group>
      </div>
      <div class="sort-controls">
        <el-select v-model="sortBy" size="small">
          <el-option label="上传时间" value="uploadTime" />
          <el-option label="名称" value="name" />
          <el-option label="大小" value="size" />
          <el-option label="下载次数" value="downloads" />
        </el-select>
      </div>
    </div>

    <div :class="['resources-grid', viewMode]">
      <el-card
        v-for="resource in resources"
        :key="resource.id"
        class="resource-card"
      >
        <div class="resource-icon">
          <el-icon :size="32">
            <component :is="getResourceIcon(resource.type)" />
          </el-icon>
        </div>
        <div class="resource-info">
          <h3>{{ resource.name }}</h3>
          <div class="resource-meta">
            <span>{{ formatSize(resource.size) }}</span>
            <span>{{ formatDate(resource.uploadTime) }}</span>
          </div>
          <div class="resource-tags">
            <el-tag
              v-for="tag in resource.tags"
              :key="tag"
              size="small"
              effect="plain"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
        <div class="resource-actions">
          <el-button-group>
            <el-button size="small" @click="$emit('preview', resource)">
              <el-icon><View /></el-icon>
            </el-button>
            <el-button size="small" @click="$emit('download', resource)">
              <el-icon><Download /></el-icon>
            </el-button>
            <el-button size="small" @click="$emit('share', resource)">
              <el-icon><Share /></el-icon>
            </el-button>
          </el-button-group>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  Grid, 
  List, 
  View, 
  Download, 
  Share,
  Document,
  Picture,
  VideoCamera,
  Files
} from '@element-plus/icons-vue'

const props = defineProps({
  resources: {
    type: Array,
    required: true
  }
})

const viewMode = ref('grid')
const sortBy = ref('uploadTime')

const getResourceIcon = (type) => {
  switch (type) {
    case 'pdf':
    case 'document':
      return Document
    case 'image':
      return Picture
    case 'video':
      return VideoCamera
    default:
      return Files
  }
}

const formatSize = (bytes) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.resource-list {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.resources-grid {
  display: grid;
  gap: 20px;
}

.resources-grid.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.resources-grid.list {
  grid-template-columns: 1fr;
}

.resource-card {
  display: flex;
  align-items: center;
  padding: 16px;
}

.resource-icon {
  margin-right: 16px;
  color: var(--primary-color);
}

.resource-info {
  flex: 1;
}

.resource-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
}

.resource-meta {
  display: flex;
  gap: 16px;
  color: #666;
  font-size: 12px;
  margin-bottom: 8px;
}

.resource-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.resource-actions {
  margin-left: 16px;
}
</style> 