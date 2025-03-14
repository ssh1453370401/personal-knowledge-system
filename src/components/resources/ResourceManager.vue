<template>
  <div class="resource-manager">
    <!-- 顶部工具栏 -->
    <div class="resource-toolbar">
      <div class="toolbar-left">
        <el-input
          v-model="searchQuery"
          placeholder="搜索资源..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
      <div class="toolbar-right">
        <el-button-group>
          <el-button type="primary" @click="showUploadDialog">
            <el-icon><Upload /></el-icon>
            上传资源
          </el-button>
          <el-button @click="showCategoryDialog">
            <el-icon><Folder /></el-icon>
            分类管理
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="resource-content">
      <!-- 左侧分类导航 -->
      <div class="resource-nav">
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

        <!-- 标签过滤器 -->
        <div class="tag-filter">
          <div class="filter-header">
            <span>标签筛选</span>
            <el-button link @click="clearTags">清除</el-button>
          </div>
          <div class="tag-cloud">
            <el-tag
              v-for="tag in availableTags"
              :key="tag"
              :type="selectedTags.includes(tag) ? 'primary' : ''"
              effect="plain"
              class="tag-item"
              @click="toggleTag(tag)"
            >
              {{ tag }}
            </el-tag>
          </div>
        </div>
      </div>

      <!-- 右侧资源列表 -->
      <div class="resource-list">
        <ResourceList
          :resources="filteredResources"
          @preview="showPreview"
          @download="handleDownload"
          @share="showShare"
        />
      </div>
    </div>

    <!-- 组件对话框 -->
    <ResourceUpload
      v-model:visible="uploadDialogVisible"
      :categories="categories"
      :available-tags="availableTags"
      @upload-success="handleUploadSuccess"
    />

    <ResourcePreview
      v-model:visible="previewDialogVisible"
      :resource="selectedResource"
      @download="handleDownload"
      @share="showShare"
    />

    <ResourceShare
      v-model:visible="shareDialogVisible"
      :resource="selectedResource"
    />

    <CategoryManager
      v-model:visible="categoryDialogVisible"
      :categories="categoriesWithCount"
      @add="handleCategoryAdd"
      @update="handleCategoryUpdate"
      @delete="handleCategoryDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Search,
  Upload,
  Folder,
  Files
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import ResourceList from './ResourceList.vue'
import ResourceUpload from './ResourceUpload.vue'
import ResourcePreview from './ResourcePreview.vue'
import ResourceShare from './ResourceShare.vue'
import CategoryManager from './CategoryManager.vue'

// State
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedTags = ref([])
const selectedResource = ref(null)

// Dialog visibility
const uploadDialogVisible = ref(false)
const previewDialogVisible = ref(false)
const shareDialogVisible = ref(false)
const categoryDialogVisible = ref(false)

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
    size: 2048576,
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
    size: 1048576,
    uploadTime: new Date(2024, 2, 15),
    categoryId: 2,
    tags: ['范文', '写作'],
    downloads: 18,
    url: 'path/to/file.doc'
  }
])

// Computed
const totalResources = computed(() => resources.value.length)

const availableTags = computed(() => {
  const tags = new Set(resources.value.flatMap(r => r.tags))
  return Array.from(tags)
})

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

  return result
})

const categoriesWithCount = computed(() => {
  return categories.value.map(category => ({
    ...category,
    count: getCategoryCount(category.id)
  }))
})

// Methods
const getCategoryCount = (categoryId) => {
  return resources.value.filter(r => r.categoryId === categoryId).length
}

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

const clearTags = () => {
  selectedTags.value = []
}

const showUploadDialog = () => {
  uploadDialogVisible.value = true
}

const showCategoryDialog = () => {
  categoryDialogVisible.value = true
}

const showPreview = (resource) => {
  selectedResource.value = resource
  previewDialogVisible.value = true
}

const showShare = (resource) => {
  selectedResource.value = resource
  shareDialogVisible.value = true
}

const handleDownload = (resource) => {
  // 实现下载逻辑
  ElMessage.success('开始下载：' + resource.name)
}

const handleUploadSuccess = (resource) => {
  resources.value.unshift(resource)
  ElMessage.success('资源上传成功')
}

const handleCategoryAdd = ({ name }) => {
  const newCategory = {
    id: Date.now(),
    name
  }
  categories.value.push(newCategory)
}

const handleCategoryUpdate = ({ id, name }) => {
  const category = categories.value.find(c => c.id === id)
  if (category) {
    category.name = name
  }
}

const handleCategoryDelete = (category) => {
  const index = categories.value.findIndex(c => c.id === category.id)
  if (index !== -1) {
    categories.value.splice(index, 1)
    // 将该分类下的资源移动到默认分类
    resources.value.forEach(resource => {
      if (resource.categoryId === category.id) {
        resource.categoryId = null
      }
    })
  }
}
</script>

<style scoped>
.resource-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.resource-toolbar {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.search-input {
  width: 300px;
}

.resource-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.resource-nav {
  width: 220px;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.count {
  margin-left: 4px;
  color: #999;
  font-size: 12px;
}

.tag-filter {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  cursor: pointer;
}

.resource-list {
  flex: 1;
  overflow-y: auto;
}
</style> 