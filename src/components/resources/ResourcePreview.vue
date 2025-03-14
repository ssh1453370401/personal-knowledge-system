<template>
  <div class="resource-preview">
    <el-dialog
      v-model="dialogVisible"
      :title="resource?.name"
      width="80%"
      destroy-on-close
      class="preview-dialog"
    >
      <div class="preview-container">
        <!-- 加载状态 -->
        <div v-if="loading" class="preview-loading">
          <el-spin class="loading-spinner" />
          <span>资源加载中...</span>
        </div>

        <!-- 预览内容 -->
        <div v-else-if="resource" class="preview-content">
          <!-- PDF预览 -->
          <div v-if="resourceType === 'pdf'" class="pdf-preview">
            <iframe
              :src="resource.url"
              width="100%"
              height="100%"
              frameborder="0"
            ></iframe>
          </div>

          <!-- 图片预览 -->
          <div v-else-if="resourceType === 'image'" class="image-preview">
            <el-image
              :src="resource.url"
              :preview-src-list="[resource.url]"
              fit="contain"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>图片加载失败</span>
                </div>
              </template>
            </el-image>
          </div>

          <!-- 文本预览 -->
          <div v-else-if="resourceType === 'text'" class="text-preview">
            <pre>{{ textContent }}</pre>
          </div>

          <!-- 视频预览 -->
          <div v-else-if="resourceType === 'video'" class="video-preview">
            <video
              controls
              :src="resource.url"
              style="max-width: 100%; max-height: 100%"
            >
              您的浏览器不支持视频播放
            </video>
          </div>

          <!-- 音频预览 -->
          <div v-else-if="resourceType === 'audio'" class="audio-preview">
            <audio
              controls
              :src="resource.url"
              style="width: 100%"
            >
              您的浏览器不支持音频播放
            </audio>
          </div>

          <!-- 不支持预览 -->
          <div v-else class="preview-not-supported">
            <el-icon :size="48"><Document /></el-icon>
            <p>该文件类型暂不支持预览</p>
            <el-button type="primary" @click="downloadResource">
              下载文件
            </el-button>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else class="preview-error">
          <el-icon :size="48"><Warning /></el-icon>
          <p>资源加载失败</p>
          <el-button @click="retryLoad">重试</el-button>
        </div>
      </div>

      <!-- 预览工具栏 -->
      <div v-if="canPreview" class="preview-toolbar">
        <div class="toolbar-left">
          <el-button-group>
            <el-button 
              v-if="resourceType === 'pdf'"
              @click="zoomIn"
            >
              <el-icon><ZoomIn /></el-icon>
            </el-button>
            <el-button 
              v-if="resourceType === 'pdf'"
              @click="zoomOut"
            >
              <el-icon><ZoomOut /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        <div class="toolbar-right">
          <el-button-group>
            <el-button @click="downloadResource">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button @click="shareResource">
              <el-icon><Share /></el-icon>
              分享
            </el-button>
          </el-button-group>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { 
  Picture,
  Document,
  Warning,
  Download,
  Share,
  ZoomIn,
  ZoomOut
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: Boolean,
  resource: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible', 'download', 'share'])

const dialogVisible = ref(false)
const loading = ref(false)
const textContent = ref('')

// 监听对话框可见性
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.resource) {
    loadResource()
  }
})

watch(() => dialogVisible.value, (newVal) => {
  emit('update:visible', newVal)
})

// 计算资源类型
const resourceType = computed(() => {
  if (!props.resource) return null
  
  const type = props.resource.type.toLowerCase()
  if (type.includes('pdf')) return 'pdf'
  if (type.includes('image')) return 'image'
  if (type.includes('text')) return 'text'
  if (type.includes('video')) return 'video'
  if (type.includes('audio')) return 'audio'
  return 'other'
})

// 是否可以预览
const canPreview = computed(() => {
  return ['pdf', 'image', 'text', 'video', 'audio'].includes(resourceType.value)
})

// 加载资源
const loadResource = async () => {
  if (!props.resource) return
  
  loading.value = true
  try {
    if (resourceType.value === 'text') {
      const response = await fetch(props.resource.url)
      textContent.value = await response.text()
    }
    // 其他类型资源的加载逻辑...
  } catch (error) {
    ElMessage.error('资源加载失败')
    console.error('Resource load error:', error)
  } finally {
    loading.value = false
  }
}

// 重试加载
const retryLoad = () => {
  loadResource()
}

// 下载资源
const downloadResource = () => {
  emit('download', props.resource)
}

// 分享资源
const shareResource = () => {
  emit('share', props.resource)
}

// PDF 缩放控制
const zoomIn = () => {
  // 实现 PDF 放大逻辑
}

const zoomOut = () => {
  // 实现 PDF 缩小逻辑
}
</script>

<style scoped>
.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  height: 70vh;
  display: flex;
  flex-direction: column;
}

.preview-container {
  flex: 1;
  overflow: hidden;
  position: relative;
  background-color: #f5f5f5;
}

.preview-loading,
.preview-error,
.preview-not-supported {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #666;
}

.preview-content {
  height: 100%;
}

.pdf-preview,
.image-preview,
.text-preview,
.video-preview,
.audio-preview {
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.text-preview {
  background-color: white;
  padding: 20px;
  overflow: auto;
}

.text-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.image-preview {
  :deep(.el-image) {
    max-width: 100%;
    max-height: 100%;
  }
}

.image-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #999;
}

.preview-toolbar {
  padding: 12px 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: white;
}
</style> 