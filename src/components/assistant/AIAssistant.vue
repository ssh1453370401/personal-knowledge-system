<template>
  <div class="ai-assistant">
    <el-card class="assistant-card">
      <template #header>
        <div class="card-header">
          <h3>智能学习助手</h3>
          <el-button-group>
            <el-button :type="mode === 'chat' ? 'primary' : ''" @click="mode = 'chat'">对话</el-button>
            <el-button :type="mode === 'analyze' ? 'primary' : ''" @click="mode = 'analyze'">分析</el-button>
          </el-button-group>
        </div>
      </template>

      <!-- 对话模式 -->
      <div v-if="mode === 'chat'" class="chat-container">
        <div class="chat-messages" ref="messagesRef">
          <div 
            v-for="message in messages" 
            :key="message.id"
            :class="['message', message.role]"
          >
            <el-avatar 
              :size="32"
              :src="message.role === 'assistant' ? assistantAvatar : userAvatar"
            />
            <div class="message-content">
              <div class="message-text" v-html="formatMessage(message.content)"></div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
        </div>

        <div class="chat-input">
          <el-input
            v-model="inputMessage"
            type="textarea"
            :rows="3"
            placeholder="输入你的问题..."
            @keyup.enter.ctrl="sendMessage"
          />
          <div class="input-actions">
            <span class="hint">Ctrl + Enter 发送</span>
            <el-button type="primary" @click="sendMessage" :loading="loading">
              发送
            </el-button>
          </div>
        </div>
      </div>

      <!-- 分析模式 -->
      <div v-else class="analyze-container">
        <div class="analyze-options">
          <el-radio-group v-model="analyzeType">
            <el-radio-button label="progress">学习进度分析</el-radio-button>
            <el-radio-button label="weakness">薄弱点分析</el-radio-button>
            <el-radio-button label="suggest">学习建议</el-radio-button>
          </el-radio-group>
        </div>

        <div class="analyze-content">
          <template v-if="analyzeType === 'progress'">
            <el-progress
              type="dashboard"
              :percentage="overallProgress"
              :color="progressColor"
            >
              <template #default>
                <div class="progress-info">
                  <div class="progress-value">{{ overallProgress }}%</div>
                  <div class="progress-label">总体进度</div>
                </div>
              </template>
            </el-progress>

            <div class="progress-details">
              <div v-for="item in progressDetails" :key="item.name" class="progress-item">
                <span>{{ item.name }}</span>
                <el-progress 
                  :percentage="item.value"
                  :color="getProgressColor(item.value)"
                />
              </div>
            </div>
          </template>

          <template v-else-if="analyzeType === 'weakness'">
            <div class="weakness-list">
              <el-collapse>
                <el-collapse-item
                  v-for="item in weaknessAnalysis"
                  :key="item.id"
                  :title="item.topic"
                >
                  <div class="weakness-detail">
                    <p>{{ item.description }}</p>
                    <div class="suggestion-list">
                      <h4>改进建议：</h4>
                      <ul>
                        <li v-for="(suggestion, index) in item.suggestions" 
                            :key="index">{{ suggestion }}</li>
                      </ul>
                    </div>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </div>
          </template>

          <template v-else>
            <div class="suggestions">
              <el-timeline>
                <el-timeline-item
                  v-for="suggestion in learningPlan"
                  :key="suggestion.id"
                  :type="suggestion.priority"
                  :color="getSuggestionColor(suggestion.priority)"
                  :timestamp="suggestion.timeframe"
                >
                  <h4>{{ suggestion.title }}</h4>
                  <p>{{ suggestion.content }}</p>
                  <div class="suggestion-actions">
                    <el-button 
                      size="small"
                      @click="addToSchedule(suggestion)"
                    >添加到计划</el-button>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </template>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// 状态
const mode = ref('chat')
const analyzeType = ref('progress')
const inputMessage = ref('')
const loading = ref(false)
const messages = ref([
  {
    id: 1,
    role: 'assistant',
    content: '你好！我是你的智能学习助手。我可以帮你：\n\n- 解答学习疑问\n- 生成复习计划\n- 分析学习进度\n- 提供学习建议',
    timestamp: new Date()
  }
])

// 模拟数据
const progressDetails = [
  { name: '行测', value: 75 },
  { name: '申论', value: 65 },
  { name: '面试', value: 80 }
]

const weaknessAnalysis = [
  {
    id: 1,
    topic: '数量关系',
    description: '在最近的练习中，数量关系部分的正确率较低，特别是工程问题和经济利润类题目。',
    suggestions: [
      '重点复习速度、时间和工程相关的公式',
      '每天练习2-3道工程问题，限时5分钟',
      '整理常见题型的解题思路和技巧'
    ]
  },
  {
    id: 2,
    topic: '申论文章写作',
    description: '文章结构较为松散，论证部分逻辑性不强。',
    suggestions: [
      '练习论证要素的提取和归纳',
      '多读优秀范文，学习论证方法',
      '建立论点论据素材库'
    ]
  }
]

const learningPlan = [
  {
    id: 1,
    title: '加强数量关系练习',
    content: '建议每天抽出1小时专门练习数量关系题目，着重提高解题速度。',
    timeframe: '近期',
    priority: 'danger'
  },
  {
    id: 2,
    title: '申论写作练习',
    content: '每周完成2篇申论写作，重点关注材料分析和论证部分。',
    timeframe: '本周',
    priority: 'warning'
  },
  {
    id: 3,
    title: '面试模拟训练',
    content: '建议参加3-5次模拟面试，熟悉面试流程和答题技巧。',
    timeframe: '本月',
    priority: 'info'
  }
]

// 计算属性
const overallProgress = computed(() => {
  const total = progressDetails.reduce((sum, item) => sum + item.value, 0)
  return Math.round(total / progressDetails.length)
})

const progressColor = computed(() => getProgressColor(overallProgress.value))

// 方法
const formatMessage = (content) => {
  return DOMPurify.sanitize(marked(content))
}

const formatTime = (timestamp) => {
  return new Date(timestamp).toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getProgressColor = (value) => {
  if (value >= 85) return '#67C23A'
  if (value >= 70) return '#409EFF'
  if (value >= 60) return '#E6A23C'
  return '#F56C6C'
}

const getSuggestionColor = (priority) => {
  switch (priority) {
    case 'danger': return '#F56C6C'
    case 'warning': return '#E6A23C'
    case 'info': return '#909399'
    default: return '#409EFF'
  }
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date()
  }

  messages.value.push(userMessage)
  loading.value = true
  inputMessage.value = ''

  // 模拟AI响应
  setTimeout(() => {
    const response = {
      id: Date.now(),
      role: 'assistant',
      content: generateResponse(userMessage.content),
      timestamp: new Date()
    }
    messages.value.push(response)
    loading.value = false
  }, 1000)
}

const generateResponse = (question) => {
  // 这里可以接入实际的AI服务
  return `我理解你的问题是关于"${question}"。\n\n建议你可以：\n\n1. 系统地整理相关知识点\n2. 制定针对性的练习计划\n3. 定期进行复习和测试`
}

const addToSchedule = (suggestion) => {
  // 这里实现添加到学习计划的逻辑
  ElMessage.success('已添加到学习计划')
}
</script>

<style scoped>
.ai-assistant {
  height: 100%;
  padding: 20px;
}

.assistant-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.chat-container {
  height: calc(100% - 60px);
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  margin-bottom: 20px;
}

.message {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.message-content {
  flex: 1;
  background: var(--bg-color-light);
  padding: 12px;
  border-radius: 8px;
}

.message.assistant .message-content {
  background: #e8f3ff;
}

.message-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.chat-input {
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.hint {
  font-size: 12px;
  color: #999;
}

.analyze-container {
  padding: 20px;
}

.analyze-options {
  margin-bottom: 20px;
  text-align: center;
}

.analyze-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.progress-info {
  text-align: center;
}

.progress-value {
  font-size: 28px;
  font-weight: bold;
  color: var(--primary-color);
}

.progress-label {
  font-size: 14px;
  color: #666;
}

.progress-details {
  width: 100%;
  margin-top: 30px;
}

.progress-item {
  margin-bottom: 20px;
}

.weakness-list {
  width: 100%;
}

.weakness-detail {
  padding: 10px;
}

.suggestion-list {
  margin-top: 10px;
}

.suggestion-list ul {
  padding-left: 20px;
}

.suggestions {
  width: 100%;
  padding: 20px;
}

.suggestion-actions {
  margin-top: 10px;
}
</style> 