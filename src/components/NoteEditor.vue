<template>
  <div class="note-editor">
    <div class="editor-header">
      <div class="note-info">
        <el-input
          v-model="note.title"
          placeholder="笔记标题"
          class="title-input"
        />
        <div class="note-meta">
          <el-tag size="small">{{ formatDate(note.updatedAt) }}</el-tag>
          <el-tag size="small" type="success">{{ note.category }}</el-tag>
        </div>
      </div>
      <div class="editor-actions">
        <el-button-group>
          <el-button 
            :type="previewMode === 'edit' ? 'primary' : ''" 
            @click="previewMode = 'edit'"
          >
            编辑
          </el-button>
          <el-button 
            :type="previewMode === 'split' ? 'primary' : ''" 
            @click="previewMode = 'split'"
          >
            分屏
          </el-button>
          <el-button 
            :type="previewMode === 'preview' ? 'primary' : ''" 
            @click="previewMode = 'preview'"
          >
            预览
          </el-button>
        </el-button-group>
        <el-button-group>
          <el-button @click="insertTemplate('table')">
            <el-icon><Grid /></el-icon>
          </el-button>
          <el-button @click="insertTemplate('code')">
            <el-icon><Terminal /></el-icon>
          </el-button>
          <el-button @click="insertTemplate('quote')">
            <el-icon><ChatDotSquare /></el-icon>
          </el-button>
        </el-button-group>
        <el-button type="primary" @click="saveNote" :loading="saving">
          保存
        </el-button>
      </div>
    </div>

    <div class="editor-container" :class="previewMode">
      <div class="editor-section" v-show="previewMode !== 'preview'">
        <div class="editor-toolbar">
          <el-button-group>
            <el-button @click="insertMarkdown('**', '**')">B</el-button>
            <el-button @click="insertMarkdown('*', '*')"><i>I</i></el-button>
            <el-button @click="insertMarkdown('~~', '~~')"><s>S</s></el-button>
          </el-button-group>
          <el-button-group>
            <el-button @click="insertMarkdown('# ')">H1</el-button>
            <el-button @click="insertMarkdown('## ')">H2</el-button>
            <el-button @click="insertMarkdown('### ')">H3</el-button>
          </el-button-group>
          <el-button-group>
            <el-button @click="insertMarkdown('- ')">
              <el-icon><List /></el-icon>
            </el-button>
            <el-button @click="insertMarkdown('1. ')">
              <el-icon><Finished /></el-icon>
            </el-button>
            <el-button @click="insertMarkdown('> ')">
              <el-icon><ChatLineSquare /></el-icon>
            </el-button>
          </el-button-group>
          <el-button-group>
            <el-button @click="showImageUpload">
              <el-icon><Picture /></el-icon>
            </el-button>
            <el-button @click="insertMarkdown('[', '](url)')">
              <el-icon><Link /></el-icon>
            </el-button>
          </el-button-group>
        </div>
        <div class="editor-area">
          <el-input
            v-model="note.content"
            type="textarea"
            :rows="20"
            resize="none"
            @input="updatePreview"
            ref="editorRef"
          />
        </div>
      </div>

      <div class="preview-section" v-show="previewMode !== 'edit'">
        <div class="preview-content markdown-body" v-html="renderedContent"></div>
      </div>
    </div>

    <!-- 图片上传对话框 -->
    <el-dialog
      v-model="imageDialogVisible"
      title="插入图片"
      width="30%"
    >
      <el-tabs v-model="imageTabActive">
        <el-tab-pane label="上传图片" name="upload">
          <el-upload
            class="image-upload"
            drag
            action="/api/upload"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
          >
            <el-icon class="el-icon--upload"><Upload /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
          </el-upload>
        </el-tab-pane>
        <el-tab-pane label="图片链接" name="url">
          <el-input
            v-model="imageUrl"
            placeholder="输入图片URL"
          />
          <div class="dialog-footer">
            <el-button @click="imageDialogVisible = false">取消</el-button>
            <el-button type="primary" @click="insertImageUrl">
              确定
            </el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- 笔记设置抽屉 -->
    <el-drawer
      v-model="settingsVisible"
      title="笔记设置"
      size="30%"
    >
      <el-form :model="note" label-width="80px">
        <el-form-item label="分类">
          <el-select v-model="note.category" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="note.tags"
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
        </el-form-item>

        <el-form-item label="关联节点">
          <el-select
            v-model="note.relatedNodes"
            multiple
            filterable
            placeholder="选择关联的知识点"
          >
            <el-option
              v-for="node in knowledgeNodes"
              :key="node.id"
              :label="node.label"
              :value="node.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="可见性">
          <el-radio-group v-model="note.visibility">
            <el-radio label="private">私密</el-radio>
            <el-radio label="public">公开</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import hljs from 'highlight.js'
import { 
  Grid, 
  Terminal, 
  ChatDotSquare,
  List,
  Finished,
  ChatLineSquare,
  Picture,
  Link,
  Upload
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import DOMPurify from 'dompurify'

// State
const previewMode = ref('edit')
const note = ref({
  title: '',
  content: '',
  category: '',
  tags: [],
  relatedNodes: [],
  visibility: 'private',
  updatedAt: new Date()
})
const saving = ref(false)
const imageDialogVisible = ref(false)
const imageTabActive = ref('upload')
const imageUrl = ref('')
const settingsVisible = ref(false)
const editorRef = ref(null)

// Mock data
const categories = [
  { label: '学习笔记', value: 'study' },
  { label: '读书笔记', value: 'reading' },
  { label: '工作笔记', value: 'work' },
  { label: '其他', value: 'other' }
]

const availableTags = [
  '行测', '申论', '面试', '时政', '经济', '法律'
]

const knowledgeNodes = [
  { id: 1, label: '行政职业能力测验' },
  { id: 2, label: '申论写作' },
  { id: 3, label: '面试技巧' }
]

// Configure marked
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true
})

// Computed
const renderedContent = computed(() => {
  if (!note.value.content) return ''
  const html = marked(note.value.content)
  return DOMPurify.sanitize(html)
})

// Methods
const updatePreview = () => {
  // 自动保存逻辑可以在这里添加
}

const insertMarkdown = (prefix, suffix = '') => {
  const textarea = editorRef.value.$el.querySelector('textarea')
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = note.value.content

  const beforeText = text.substring(0, start)
  const selectedText = text.substring(start, end)
  const afterText = text.substring(end)

  note.value.content = beforeText + prefix + selectedText + suffix + afterText

  // 恢复选区
  nextTick(() => {
    textarea.focus()
    textarea.setSelectionRange(
      start + prefix.length,
      end + prefix.length
    )
  })
}

const insertTemplate = (type) => {
  let template = ''
  switch (type) {
    case 'table':
      template = '\n| 表头1 | 表头2 | 表头3 |\n| --- | --- | --- |\n| 内容1 | 内容2 | 内容3 |\n'
      break
    case 'code':
      template = '\n```javascript\n// 代码块\n```\n'
      break
    case 'quote':
      template = '\n> 引用内容\n'
      break
  }
  note.value.content += template
}

const showImageUpload = () => {
  imageDialogVisible.value = true
  imageTabActive.value = 'upload'
  imageUrl.value = ''
}

const beforeImageUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }

  return isImage && isLt2M
}

const handleImageSuccess = (response) => {
  const url = response.url
  insertMarkdown(`![图片](${url})`)
  imageDialogVisible.value = false
}

const insertImageUrl = () => {
  if (imageUrl.value) {
    insertMarkdown(`![图片](${imageUrl.value})`)
    imageDialogVisible.value = false
  }
}

const saveNote = async () => {
  saving.value = true
  try {
    // 实现保存笔记的逻辑
    await new Promise(resolve => setTimeout(resolve, 1000)) // 模拟API调用
    note.value.updatedAt = new Date()
    ElMessage.success('笔记已保存')
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// Lifecycle hooks
onMounted(() => {
  // 加载笔记数据
})
</script>

<style>
/* 引入 highlight.js 样式 */
@import 'highlight.js/styles/github.css';
/* 引入 GitHub Markdown 样式 */
@import 'github-markdown-css/github-markdown.css';

.note-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.note-info {
  flex: 1;
  margin-right: 20px;
}

.title-input {
  margin-bottom: 8px;
}

.note-meta {
  display: flex;
  gap: 8px;
}

.editor-actions {
  display: flex;
  gap: 12px;
}

.editor-container {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-container.edit .editor-section {
  width: 100%;
}

.editor-container.preview .preview-section {
  width: 100%;
}

.editor-container.split .editor-section,
.editor-container.split .preview-section {
  width: 50%;
}

.editor-section,
.preview-section {
  height: 100%;
  overflow-y: auto;
}

.editor-toolbar {
  padding: 8px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  gap: 8px;
}

.editor-area {
  height: calc(100% - 45px);
}

.editor-area :deep(.el-textarea__inner) {
  height: 100%;
  font-family: 'Fira Code', monospace;
}

.preview-content {
  padding: 20px;
}

.image-upload {
  text-align: center;
}

.dialog-footer {
  margin-top: 20px;
  text-align: right;
}

/* Markdown 预览样式调整 */
.markdown-body {
  box-sizing: border-box;
  min-width: 200px;
  max-width: 980px;
  margin: 0 auto;
}

@media (max-width: 767px) {
  .markdown-body {
    padding: 15px;
  }
}
</style> 