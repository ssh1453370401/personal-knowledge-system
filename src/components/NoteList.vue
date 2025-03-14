<template>
  <div class="note-list">
    <div class="list-header">
      <el-input
        v-model="searchQuery"
        placeholder="搜索笔记..."
        prefix-icon="Search"
        clearable
      />
      <el-button type="primary" @click="createNote">
        <el-icon><Plus /></el-icon> 新建笔记
      </el-button>
    </div>

    <div class="list-filters">
      <el-select
        v-model="selectedCategory"
        placeholder="分类"
        clearable
      >
        <el-option
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
        />
      </el-select>

      <el-select
        v-model="selectedTags"
        multiple
        collapse-tags
        placeholder="标签"
        clearable
      >
        <el-option
          v-for="tag in availableTags"
          :key="tag"
          :label="tag"
          :value="tag"
        />
      </el-select>

      <el-radio-group v-model="sortBy" size="small">
        <el-radio-button label="updated">最近更新</el-radio-button>
        <el-radio-button label="created">创建时间</el-radio-button>
      </el-radio-group>
    </div>

    <el-scrollbar height="calc(100% - 110px)">
      <div class="note-items">
        <div 
          v-for="note in filteredNotes" 
          :key="note.id"
          class="note-item"
          :class="{ active: selectedNote?.id === note.id }"
          @click="selectNote(note)"
        >
          <div class="note-item-header">
            <h3>{{ note.title || '无标题笔记' }}</h3>
            <el-dropdown trigger="click" @command="handleNoteAction($event, note)">
              <el-button link>
                <el-icon><More /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="share">分享</el-dropdown-item>
                  <el-dropdown-item 
                    command="delete" 
                    divided
                    class="text-danger"
                  >
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <div class="note-preview">{{ note.preview }}</div>

          <div class="note-meta">
            <div class="note-tags">
              <el-tag 
                v-for="tag in note.tags" 
                :key="tag"
                size="small"
              >
                {{ tag }}
              </el-tag>
            </div>
            <span class="note-time">{{ formatDate(note.updatedAt) }}</span>
          </div>
        </div>

        <div v-if="filteredNotes.length === 0" class="empty-state">
          <el-empty description="暂无笔记" />
        </div>
      </div>
    </el-scrollbar>

    <!-- 分享笔记对话框 -->
    <el-dialog
      v-model="shareDialogVisible"
      title="分享笔记"
      width="30%"
    >
      <div class="share-options">
        <el-radio-group v-model="shareType">
          <el-radio label="link">链接分享</el-radio>
          <el-radio label="qrcode">二维码分享</el-radio>
        </el-radio-group>

        <div class="share-content">
          <template v-if="shareType === 'link'">
            <el-input
              v-model="shareLink"
              readonly
            >
              <template #append>
                <el-button @click="copyShareLink">复制</el-button>
              </template>
            </el-input>
          </template>
          <template v-else>
            <div class="qrcode-container">
              <!-- 这里放置二维码组件 -->
            </div>
          </template>
        </div>

        <div class="share-settings">
          <el-checkbox v-model="shareSettings.requirePassword">
            需要密码
          </el-checkbox>
          <el-input
            v-if="shareSettings.requirePassword"
            v-model="shareSettings.password"
            placeholder="设置访问密码"
            show-password
          />
          
          <el-form-item label="有效期">
            <el-select v-model="shareSettings.expireTime">
              <el-option label="1天" value="1" />
              <el-option label="7天" value="7" />
              <el-option label="30天" value="30" />
              <el-option label="永久" value="-1" />
            </el-select>
          </el-form-item>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, Plus, More } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// State
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedTags = ref([])
const sortBy = ref('updated')
const selectedNote = ref(null)
const shareDialogVisible = ref(false)
const shareType = ref('link')
const shareLink = ref('')
const shareSettings = ref({
  requirePassword: false,
  password: '',
  expireTime: '7'
})

// Mock data
const notes = ref([
  {
    id: 1,
    title: '行测数量关系解题技巧',
    content: '# 数量关系解题技巧\n\n1. 方程法\n2. 赋值法\n3. 代入排除法\n...',
    preview: '数量关系是行测考试中的重要考点，掌握正确的解题技巧可以...',
    category: 'study',
    tags: ['行测', '数量关系'],
    createdAt: new Date(2024, 2, 1),
    updatedAt: new Date(2024, 2, 10)
  },
  {
    id: 2,
    title: '申论文章写作框架',
    content: '# 申论文章写作框架\n\n## 开头部分\n\n1. 点题\n2. 提出问题\n...',
    preview: '申论文章写作需要有清晰的框架结构，一般包括：开头点题、分论点论证...',
    category: 'study',
    tags: ['申论', '写作'],
    createdAt: new Date(2024, 2, 5),
    updatedAt: new Date(2024, 2, 12)
  }
])

const categories = [
  { label: '学习笔记', value: 'study' },
  { label: '读书笔记', value: 'reading' },
  { label: '工作笔记', value: 'work' },
  { label: '其他', value: 'other' }
]

const availableTags = [
  '行测', '申论', '面试', '时政', '经济', '法律'
]

// Computed
const filteredNotes = computed(() => {
  let result = [...notes.value]

  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query)
    )
  }

  // 分类过滤
  if (selectedCategory.value) {
    result = result.filter(note => note.category === selectedCategory.value)
  }

  // 标签过滤
  if (selectedTags.value.length > 0) {
    result = result.filter(note => 
      selectedTags.value.every(tag => note.tags.includes(tag))
    )
  }

  // 排序
  result.sort((a, b) => {
    const dateA = new Date(sortBy.value === 'updated' ? a.updatedAt : a.createdAt)
    const dateB = new Date(sortBy.value === 'updated' ? b.updatedAt : b.createdAt)
    return dateB - dateA
  })

  return result
})

// Methods
const createNote = () => {
  // 触发创建笔记事件
  emit('create')
}

const selectNote = (note) => {
  selectedNote.value = note
  // 触发选择笔记事件
  emit('select', note)
}

const handleNoteAction = async (command, note) => {
  switch (command) {
    case 'edit':
      emit('edit', note)
      break
    case 'share':
      shareNote(note)
      break
    case 'delete':
      await deleteNote(note)
      break
  }
}

const shareNote = (note) => {
  shareLink.value = `https://your-domain.com/share/${note.id}`
  shareDialogVisible.value = true
}

const copyShareLink = () => {
  navigator.clipboard.writeText(shareLink.value)
  ElMessage.success('链接已复制')
}

const deleteNote = async (note) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除这个笔记吗？此操作不可恢复。',
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    // 实现删除笔记的逻辑
    const index = notes.value.findIndex(n => n.id === note.id)
    if (index !== -1) {
      notes.value.splice(index, 1)
      ElMessage.success('笔记已删除')
      
      if (selectedNote.value?.id === note.id) {
        selectedNote.value = null
      }
    }
  } catch {
    // 用户取消删除
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// Emits
const emit = defineEmits(['create', 'select', 'edit'])
</script>

<style scoped>
.note-list {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-color);
}

.list-header {
  padding: 16px;
  display: flex;
  gap: 12px;
}

.list-filters {
  padding: 0 16px 16px;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}

.note-items {
  padding: 16px;
}

.note-item {
  padding: 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 12px;
}

.note-item:hover {
  background-color: var(--bg-color-light);
}

.note-item.active {
  background-color: var(--bg-color-light);
  border-left: 3px solid var(--primary-color);
}

.note-item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.note-item-header h3 {
  margin: 0;
  font-size: 16px;
}

.note-preview {
  color: #666;
  font-size: 14px;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-tags {
  display: flex;
  gap: 4px;
}

.note-time {
  font-size: 12px;
  color: #999;
}

.empty-state {
  padding: 40px 0;
}

.share-options {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.share-content {
  margin-top: 20px;
}

.qrcode-container {
  display: flex;
  justify-content: center;
  padding: 20px;
}

.share-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.text-danger {
  color: var(--el-color-danger);
}
</style> 