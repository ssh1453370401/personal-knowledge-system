<template>
  <div class="study-notes">
    <div class="notes-header">
      <div class="header-left">
        <h2>学习笔记</h2>
        <el-tag v-if="selectedCategory" closable @close="clearCategory">
          {{ selectedCategory }}
        </el-tag>
      </div>
      <div class="header-actions">
        <el-input
          v-model="searchQuery"
          placeholder="搜索笔记..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-button type="primary" @click="createNote">
          <el-icon><EditPen /></el-icon> 新建笔记
        </el-button>
      </div>
    </div>

    <div class="notes-container">
      <!-- 左侧笔记列表 -->
      <div class="notes-list">
        <div class="list-header">
          <el-select v-model="sortBy" size="small">
            <el-option label="最近更新" value="updated" />
            <el-option label="创建时间" value="created" />
            <el-option label="标题" value="title" />
          </el-select>
          <el-button-group>
            <el-button 
              :type="viewMode === 'list' ? 'primary' : ''" 
              @click="viewMode = 'list'"
            >
              <el-icon><List /></el-icon>
            </el-button>
            <el-button 
              :type="viewMode === 'grid' ? 'primary' : ''" 
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
          </el-button-group>
        </div>

        <div :class="['notes-grid', viewMode]">
          <el-card
            v-for="note in filteredNotes"
            :key="note.id"
            :class="['note-card', { active: selectedNote?.id === note.id }]"
            @click="selectNote(note)"
          >
            <template #header>
              <div class="note-header">
                <h3>{{ note.title }}</h3>
                <el-dropdown trigger="click" @command="handleNoteAction">
                  <el-button link>
                    <el-icon><More /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item :command="['edit', note]">编辑</el-dropdown-item>
                      <el-dropdown-item :command="['review', note]">设置复习</el-dropdown-item>
                      <el-dropdown-item :command="['delete', note]" divided>删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
            <div class="note-preview">
              <div class="note-meta">
                <el-tag size="small" type="info">{{ note.category }}</el-tag>
                <span class="note-date">{{ formatDate(note.updatedAt) }}</span>
              </div>
              <p class="note-excerpt">{{ note.content.substring(0, 100) }}...</p>
              <div class="note-footer">
                <div class="note-tags">
                  <el-tag 
                    v-for="tag in note.tags" 
                    :key="tag"
                    size="small"
                    effect="plain"
                  >
                    {{ tag }}
                  </el-tag>
                </div>
                <div class="review-status" v-if="note.nextReview">
                  <el-tooltip :content="getReviewStatus(note)">
                    <el-icon :class="getReviewStatusIcon(note)">
                      <Clock />
                    </el-icon>
                  </el-tooltip>
                </div>
              </div>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 右侧编辑区域 -->
      <div class="note-editor" v-if="selectedNote">
        <div class="editor-header">
          <el-input
            v-model="editingNote.title"
            placeholder="笔记标题"
            class="title-input"
          />
          <div class="editor-actions">
            <el-button-group>
              <el-button @click="saveNote" type="primary">保存</el-button>
              <el-button @click="cancelEdit">取消</el-button>
            </el-button-group>
          </div>
        </div>

        <div class="editor-toolbar">
          <el-select v-model="editingNote.category" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category"
              :label="category"
              :value="category"
            />
          </el-select>
          <el-select
            v-model="editingNote.tags"
            multiple
            filterable
            allow-create
            placeholder="添加标签"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </div>

        <div class="editor-main">
          <el-tabs v-model="editorTab">
            <el-tab-pane label="编辑" name="edit">
              <div class="markdown-editor">
                <textarea
                  v-model="editingNote.content"
                  placeholder="开始写笔记..."
                  @input="updatePreview"
                ></textarea>
              </div>
            </el-tab-pane>
            <el-tab-pane label="预览" name="preview">
              <div class="markdown-preview" v-html="previewContent"></div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <el-empty description="选择笔记开始编辑">
          <el-button type="primary" @click="createNote">新建笔记</el-button>
        </el-empty>
      </div>
    </div>

    <!-- 复习提醒设置对话框 -->
    <el-dialog
      v-model="reviewDialogVisible"
      title="设置复习计划"
      width="400px"
    >
      <el-form :model="reviewForm" label-width="100px">
        <el-form-item label="复习周期">
          <el-select v-model="reviewForm.interval">
            <el-option label="每天" value="daily" />
            <el-option label="每周" value="weekly" />
            <el-option label="每月" value="monthly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="下次复习" v-if="reviewForm.interval === 'custom'">
          <el-date-picker
            v-model="reviewForm.nextReview"
            type="datetime"
            placeholder="选择日期和时间"
          />
        </el-form-item>

        <el-form-item label="提醒方式">
          <el-checkbox-group v-model="reviewForm.reminders">
            <el-checkbox label="browser">浏览器通知</el-checkbox>
            <el-checkbox label="email">邮件提醒</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveReviewPlan">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { 
  EditPen, 
  Search, 
  More, 
  List, 
  Grid, 
  Clock 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// State
const searchQuery = ref('')
const selectedCategory = ref('')
const viewMode = ref('grid')
const sortBy = ref('updated')
const selectedNote = ref(null)
const editingNote = ref(null)
const editorTab = ref('edit')
const previewContent = ref('')
const reviewDialogVisible = ref(false)
const reviewForm = ref({
  interval: 'weekly',
  nextReview: null,
  reminders: ['browser']
})

// Mock data
const notes = ref([
  {
    id: 1,
    title: '行测数量关系解题技巧',
    content: '# 数量关系解题要点\n\n1. 审题要仔细\n2. 找准切入点\n3. 选择合适的解题方法\n\n## 常用解题方法\n\n- 代入排除法\n- 方程法\n- 赋值法',
    category: '行测',
    tags: ['数量关系', '解题技巧'],
    createdAt: new Date(2024, 2, 1),
    updatedAt: new Date(2024, 2, 15),
    nextReview: new Date(2024, 2, 20)
  },
  {
    id: 2,
    title: '申论文章框架模板',
    content: '# 申论文章框架\n\n## 开头段\n\n- 点明主题\n- 提出观点\n\n## 分论点\n\n1. 现状分析\n2. 问题剖析\n3. 对策建议',
    category: '申论',
    tags: ['写作模板', '框架'],
    createdAt: new Date(2024, 2, 10),
    updatedAt: new Date(2024, 2, 10)
  }
])

// Computed
const categories = computed(() => {
  const cats = new Set(notes.value.map(note => note.category))
  return Array.from(cats)
})

const availableTags = computed(() => {
  const tags = new Set(notes.value.flatMap(note => note.tags))
  return Array.from(tags)
})

const filteredNotes = computed(() => {
  let filtered = [...notes.value]
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(note => 
      note.title.toLowerCase().includes(query) ||
      note.content.toLowerCase().includes(query) ||
      note.tags.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // Apply category filter
  if (selectedCategory.value) {
    filtered = filtered.filter(note => note.category === selectedCategory.value)
  }
  
  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'updated':
        return b.updatedAt - a.updatedAt
      case 'created':
        return b.createdAt - a.createdAt
      case 'title':
        return a.title.localeCompare(b.title)
      default:
        return 0
    }
  })
  
  return filtered
})

// Methods
const createNote = () => {
  const newNote = {
    id: Date.now(),
    title: '新笔记',
    content: '',
    category: '',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
  notes.value.unshift(newNote)
  selectNote(newNote)
}

const selectNote = (note) => {
  selectedNote.value = note
  editingNote.value = { ...note }
}

const saveNote = () => {
  const index = notes.value.findIndex(n => n.id === selectedNote.value.id)
  if (index !== -1) {
    editingNote.value.updatedAt = new Date()
    notes.value[index] = { ...editingNote.value }
    selectedNote.value = notes.value[index]
    ElMessage.success('笔记已保存')
  }
}

const cancelEdit = () => {
  editingNote.value = { ...selectedNote.value }
}

const updatePreview = () => {
  const rawContent = editingNote.value.content
  const htmlContent = marked(rawContent)
  previewContent.value = DOMPurify.sanitize(htmlContent)
}

const handleNoteAction = ([action, note]) => {
  switch (action) {
    case 'edit':
      selectNote(note)
      break
    case 'review':
      reviewDialogVisible.value = true
      break
    case 'delete':
      ElMessageBox.confirm(
        '确定要删除这个笔记吗？此操作不可恢复。',
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(() => {
        const index = notes.value.findIndex(n => n.id === note.id)
        if (index !== -1) {
          notes.value.splice(index, 1)
          if (selectedNote.value?.id === note.id) {
            selectedNote.value = null
            editingNote.value = null
          }
          ElMessage.success('笔记已删除')
        }
      })
      break
  }
}

const saveReviewPlan = () => {
  if (selectedNote.value) {
    const nextReview = reviewForm.value.interval === 'custom'
      ? reviewForm.value.nextReview
      : calculateNextReview(reviewForm.value.interval)
    
    selectedNote.value.nextReview = nextReview
    selectedNote.value.reviewInterval = reviewForm.value.interval
    selectedNote.value.reminders = [...reviewForm.value.reminders]
    
    ElMessage.success('复习计划已设置')
    reviewDialogVisible.value = false
  }
}

const calculateNextReview = (interval) => {
  const now = new Date()
  switch (interval) {
    case 'daily':
      return new Date(now.setDate(now.getDate() + 1))
    case 'weekly':
      return new Date(now.setDate(now.getDate() + 7))
    case 'monthly':
      return new Date(now.setMonth(now.getMonth() + 1))
    default:
      return now
  }
}

const getReviewStatus = (note) => {
  if (!note.nextReview) return ''
  
  const now = new Date()
  const review = new Date(note.nextReview)
  const diffDays = Math.ceil((review - now) / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) {
    return '已过期'
  } else if (diffDays === 0) {
    return '今天需要复习'
  } else {
    return `${diffDays}天后复习`
  }
}

const getReviewStatusIcon = (note) => {
  if (!note.nextReview) return ''
  
  const now = new Date()
  const review = new Date(note.nextReview)
  
  return review < now ? 'review-overdue' : 'review-scheduled'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const clearCategory = () => {
  selectedCategory.value = ''
}
</script>

<style scoped>
.study-notes {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.notes-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-left h2 {
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.search-input {
  width: 200px;
}

.notes-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.notes-list {
  width: 100%;
  max-width: 800px;
  padding: 20px;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.notes-grid {
  display: grid;
  gap: 20px;
}

.notes-grid.grid {
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.notes-grid.list {
  grid-template-columns: 1fr;
}

.note-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.note-card:hover {
  transform: translateY(-2px);
}

.note-card.active {
  border: 2px solid var(--primary-color);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-header h3 {
  margin: 0;
  font-size: 16px;
}

.note-preview {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.note-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-date {
  font-size: 12px;
  color: #666;
}

.note-excerpt {
  color: #666;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.note-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.review-status {
  color: var(--primary-color);
}

.review-status .review-overdue {
  color: #F56C6C;
}

.note-editor {
  flex: 1;
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-light);
}

.editor-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
}

.title-input {
  flex: 1;
}

.editor-toolbar {
  padding: 12px 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 12px;
}

.editor-main {
  flex: 1;
  overflow: hidden;
}

.markdown-editor,
.markdown-preview {
  height: 100%;
  padding: 20px;
  overflow-y: auto;
}

.markdown-editor textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  font-family: monospace;
}

.empty-state {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style> 