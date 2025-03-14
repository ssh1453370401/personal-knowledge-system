<template>
  <div class="resource-manager">
    <div class="resource-header">
      <h2>学习资源库</h2>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索资源..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-button type="primary" @click="showUploadDialog">
          <el-icon><Upload /></el-icon> 上传资源
        </el-button>
      </div>
    </div>

    <div class="resource-content">
      <el-row :gutter="20">
        <!-- 左侧分类导航 -->
        <el-col :span="6">
          <el-card class="category-nav">
            <template #header>
              <div class="nav-header">
                <span>资源分类</span>
                <el-button link @click="showCategoryDialog">
                  <el-icon><Edit /></el-icon>
                </el-button>
              </div>
            </template>
            <el-menu
              :default-active="selectedCategory"
              @select="handleCategorySelect"
            >
              <el-menu-item index="all">
                <el-icon><Files /></el-icon>
                <span>全部资源</span>
                <span class="count">({{ totalResources }})</span>
              </el-menu-item>
              <el-menu-item
                v-for="category in categories"
                :key="category.id"
                :index="category.id.toString()"
              >
                <el-icon><Folder /></el-icon>
                <span>{{ category.name }}</span>
                <span class="count">({{ getCategoryCount(category.id) }})</span>
              </el-menu-item>
            </el-menu>
          </el-card>

          <el-card class="tags-card">
            <template #header>
              <div class="card-header">
                <span>标签筛选</span>
              </div>
            </template>
            <div class="tag-cloud">
              <el-tag
                v-for="tag in tags"
                :key="tag"
                :type="selectedTags.includes(tag) ? 'primary' : ''"
                effect="plain"
                class="tag-item"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </el-tag>
            </div>
          </el-card>
        </el-col>

        <!-- 右侧资源列表 -->
        <el-col :span="18">
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
                <el-button
                  :icon="sortOrder === 'asc' ? 'SortUp' : 'SortDown'"
                  @click="toggleSortOrder"
                  size="small"
                />
              </div>
            </div>

            <div :class="['resources-grid', viewMode]">
              <el-card
                v-for="resource in filteredResources"
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
                  <el-tooltip content="预览">
                    <el-button
                      circle
                      @click="previewResource(resource)"
                      :disabled="!isPreviewable(resource)"
                    >
                      <el-icon><View /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-tooltip content="下载">
                    <el-button circle @click="downloadResource(resource)">
                      <el-icon><Download /></el-icon>
                    </el-button>
                  </el-tooltip>
                  <el-dropdown trigger="click" @command="handleResourceAction">
                    <el-button circle>
                      <el-icon><More /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item :command="['edit', resource]">
                          编辑信息
                        </el-dropdown-item>
                        <el-dropdown-item :command="['share', resource]">
                          分享
                        </el-dropdown-item>
                        <el-dropdown-item 
                          :command="['delete', resource]"
                          divided
                          type="danger"
                        >
                          删除
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
              </el-card>
            </div>

            <!-- 空状态 -->
            <el-empty
              v-if="filteredResources.length === 0"
              description="暂无资源"
            >
              <el-button type="primary" @click="showUploadDialog">
                上传资源
              </el-button>
            </el-empty>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传资源"
      width="500px"
    >
      <el-form :model="uploadForm" label-width="80px">
        <el-form-item label="资源文件">
          <el-upload
            class="resource-upload"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="名称">
          <el-input v-model="uploadForm.name" />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="uploadForm.categoryId">
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="uploadForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择标签"
          >
            <el-option
              v-for="tag in tags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitUpload">
            确认上传
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewDialogVisible"
      :title="previewingResource?.name"
      width="80%"
      class="preview-dialog"
    >
      <div class="preview-content" v-if="previewingResource">
        <!-- PDF预览 -->
        <iframe
          v-if="previewingResource.type === 'pdf'"
          :src="previewingResource.url"
          width="100%"
          height="600"
        ></iframe>
        <!-- 图片预览 -->
        <img
          v-else-if="previewingResource.type === 'image'"
          :src="previewingResource.url"
          style="max-width: 100%"
        />
        <!-- 文本预览 -->
        <pre v-else-if="previewingResource.type === 'text'">
          {{ previewingResource.content }}
        </pre>
        <!-- 不支持预览 -->
        <div v-else class="preview-not-supported">
          该文件类型暂不支持预览
        </div>
      </div>
    </el-dialog>

    <!-- 分享对话框 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享资源"
      width="400px"
    >
      <div class="share-options">
        <el-form :model="shareForm" label-width="100px">
          <el-form-item label="访问权限">
            <el-radio-group v-model="shareForm.access">
              <el-radio label="public">公开</el-radio>
              <el-radio label="private">私有</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="过期时间" v-if="shareForm.access === 'private'">
            <el-date-picker
              v-model="shareForm.expireTime"
              type="datetime"
              placeholder="选择日期时间"
            />
          </el-form-item>

          <el-form-item label="分享链接">
            <div class="share-link">
              <el-input v-model="shareLink" readonly />
              <el-button type="primary" @click="copyShareLink">
                复制链接
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="二维码">
            <div class="qr-code" ref="qrCodeRef"></div>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template> 

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Upload,
  Download,
  View,
  Edit,
  Delete,
  More,
  Grid,
  List,
  Files,
  Folder,
  Document,
  Picture,
  VideoCamera
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import QRCode from 'qrcode'

// State
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedTags = ref([])
const viewMode = ref('grid')
const sortBy = ref('uploadTime')
const sortOrder = ref('desc')
const uploadDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const shareDialogVisible = ref(false)
const previewingResource = ref(null)

// Mock data
const categories = ref([
  { id: 1, name: '行测资料' },
  { id: 2, name: '申论资料' },
  { id: 3, name: '面试资料' }
])

const resources = ref([
  {
    id: 1,
    name: '行测真题解析.pdf',
    type: 'pdf',
    size: 2048576, // 2MB
    uploadTime: new Date(2024, 2, 1),
    categoryId: 1,
    tags: ['真题', '解析'],
    downloads: 25,
    url: 'path/to/file.pdf'
  },
  {
    id: 2,
    name: '申论范文集锦.doc',
    type: 'document',
    size: 1048576, // 1MB
    uploadTime: new Date(2024, 2, 15),
    categoryId: 2,
    tags: ['范文', '写作'],
    downloads: 18,
    url: 'path/to/file.doc'
  }
])

// Forms
const uploadForm = ref({
  file: null,
  name: '',
  categoryId: null,
  tags: [],
  description: ''
})

const shareForm = ref({
  access: 'public',
  expireTime: null
})

// Computed
const tags = computed(() => {
  const allTags = new Set(resources.value.flatMap(r => r.tags))
  return Array.from(allTags)
})

const totalResources = computed(() => resources.value.length)

const filteredResources = computed(() => {
  let result = [...resources.value]

  // Apply category filter
  if (selectedCategory.value !== 'all') {
    result = result.filter(r => r.categoryId === parseInt(selectedCategory.value))
  }

  // Apply tag filter
  if (selectedTags.value.length > 0) {
    result = result.filter(r => 
      selectedTags.value.every(tag => r.tags.includes(tag))
    )
  }

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(r => 
      r.name.toLowerCase().includes(query) ||
      r.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }

  // Apply sorting
  result.sort((a, b) => {
    let comparison = 0
    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'size':
        comparison = a.size - b.size
        break
      case 'downloads':
        comparison = a.downloads - b.downloads
        break
      default: // uploadTime
        comparison = new Date(a.uploadTime) - new Date(b.uploadTime)
    }
    return sortOrder.value === 'asc' ? comparison : -comparison
  })

  return result
})

// Methods
const handleCategorySelect = (categoryId) => {
  selectedCategory.value = categoryId
}

const toggleTag = (tag) => {
  const index = selectedTags.value.indexOf(tag)
  if (index === -1) {
    selectedTags.value.push(tag)
  } else {
    selectedTags.value.splice(index, 1)
  }
}

const getCategoryCount = (categoryId) => {
  return resources.value.filter(r => r.categoryId === categoryId).length
}

const showUploadDialog = () => {
  uploadForm.value = {
    file: null,
    name: '',
    categoryId: null,
    tags: [],
    description: ''
  }
  uploadDialogVisible.value = true
}

const handleFileChange = (file) => {
  uploadForm.value.file = file
  uploadForm.value.name = file.name
}

const submitUpload = () => {
  // Here you would typically upload the file to your server
  const newResource = {
    id: Date.now(),
    name: uploadForm.value.name,
    type: getFileType(uploadForm.value.file),
    size: uploadForm.value.file.size,
    uploadTime: new Date(),
    categoryId: uploadForm.value.categoryId,
    tags: uploadForm.value.tags,
    downloads: 0,
    url: URL.createObjectURL(uploadForm.value.file.raw)
  }
  
  resources.value.push(newResource)
  ElMessage.success('资源上传成功')
  uploadDialogVisible.value = false
}

const getFileType = (file) => {
  const extension = file.name.split('.').pop().toLowerCase()
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) return 'image'
  if (['pdf'].includes(extension)) return 'pdf'
  if (['doc', 'docx', 'txt'].includes(extension)) return 'document'
  if (['mp4', 'avi', 'mov'].includes(extension)) return 'video'
  return 'other'
}

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

const previewResource = (resource) => {
  previewingResource.value = resource
  previewDialogVisible.value = true
}

const isPreviewable = (resource) => {
  return ['pdf', 'image', 'text'].includes(resource.type)
}

const downloadResource = (resource) => {
  // Here you would typically handle the actual file download
  const link = document.createElement('a')
  link.href = resource.url
  link.download = resource.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Update download count
  resource.downloads++
  ElMessage.success('开始下载')
}

const handleResourceAction = async ([action, resource]) => {
  switch (action) {
    case 'edit':
      // Handle edit
      break
    case 'share':
      await showShareDialog(resource)
      break
    case 'delete':
      ElMessageBox.confirm(
        '确定要删除这个资源吗？此操作不可恢复。',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = resources.value.findIndex(r => r.id === resource.id)
        if (index !== -1) {
          resources.value.splice(index, 1)
          ElMessage.success('资源已删除')
        }
      })
      break
  }
}

const showShareDialog = async (resource) => {
  shareForm.value = {
    access: 'public',
    expireTime: null
  }
  shareDialogVisible.value = true
  
  // Generate QR code
  const shareUrl = `${window.location.origin}/share/${resource.id}`
  await generateQRCode(shareUrl)
}

const generateQRCode = async (url) => {
  try {
    const qrCodeRef = document.querySelector('.qr-code')
    if (qrCodeRef) {
      await QRCode.toCanvas(qrCodeRef, url, {
        width: 200,
        margin: 2
      })
    }
  } catch (err) {
    console.error('QR Code generation error:', err)
  }
}

const copyShareLink = () => {
  navigator.clipboard.writeText(shareLink.value)
    .then(() => ElMessage.success('链接已复制'))
    .catch(() => ElMessage.error('复制失败'))
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

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
}
</script>

<style scoped>
.resource-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resource-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 200px;
}

.resource-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.category-nav {
  margin-bottom: 20px;
}

.nav-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.count {
  margin-left: 4px;
  color: #999;
  font-size: 12px;
}

.tags-card {
  margin-bottom: 20px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
}

.list-header {
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  display: flex;
  gap: 8px;
}

.resource-upload {
  width: 100%;
}

.share-link {
  display: flex;
  gap: 8px;
}

.qr-code {
  display: flex;
  justify-content: center;
  padding: 16px;
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.preview-content {
  padding: 20px;
  min-height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.preview-not-supported {
  color: #999;
<template>
  <div class="resource-manager">
    <div class="resource-header">
      <h2>学习资源库</h2>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索资源..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-button type="primary" @click="showUploadDialog">
          <el-icon><Upload /></el-icon> 上传资源
        </el-button>
      </div>
    </div>

    <div class="resource-content">
      <el-row :gutter="20">
        <!-- 左侧分类导航 -->
        <el-col :span="6">
          <el-card class="category-
</template> 