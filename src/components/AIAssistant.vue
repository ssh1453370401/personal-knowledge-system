<template>
  <div class="ai-assistant">
    <el-popover
      v-model:visible="visible"
      placement="right"
      :width="400"
      trigger="click"
    >
      <template #reference>
        <el-button 
          type="primary" 
          circle
          class="ai-button"
        >
          <el-icon><Magic /></el-icon>
        </el-button>
      </template>

      <div class="ai-panel">
        <div class="ai-header">
          <h3>AI 助手</h3>
          <el-select v-model="action" size="small">
            <el-option label="总结内容" value="summarize" />
            <el-option label="扩展内容" value="expand" />
            <el-option label="优化表达" value="improve" />
          </el-select>
        </div>

        <div class="ai-content">
          <el-input
            v-model="prompt"
            type="textarea"
            :rows="4"
            placeholder="请输入需要处理的内容..."
          />

          <div v-if="result" class="ai-result">
            <div class="result-header">
              <span>AI 建议</span>
              <el-button 
                type="primary" 
                link
                size="small"
                @click="applyResult"
              >
                应用
              </el-button>
            </div>
            <div class="result-content">
              {{ result }}
            </div>
          </div>
        </div>

        <div class="ai-footer">
          <el-button 
            type="primary" 
            :loading="loading"
            @click="processContent"
          >
            生成
          </el-button>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Magic } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:content'])

const visible = ref(false)
const action = ref('summarize')
const prompt = ref('')
const result = ref('')
const loading = ref(false)

const processContent = async () => {
  if (!prompt.value) {
    ElMessage.warning('请输入需要处理的内容')
    return
  }

  loading.value = true
  try {
    const response = await fetch('/api/aiAssistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: prompt.value,
        type: action.value
      })
    })
    const data = await response.json()
    result.value = data.content
  } catch (error) {
    ElMessage.error('处理失败')
  } finally {
    loading.value = false
  }
}

const applyResult = () => {
  emit('update:content', result.value)
  visible.value = false
  ElMessage.success('已应用 AI 建议')
}

watch(() => props.content, (newContent) => {
  prompt.value = newContent
})
</script>

<style scoped>
.ai-assistant {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 1000;
}

.ai-button {
  width: 50px;
  height: 50px;
}

.ai-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.ai-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.ai-result {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  padding: 12px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-content {
  font-size: 14px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
}

.ai-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 