<template>
  <div class="study-assistant">
    <div class="assistant-header">
      <h2>智能学习助手</h2>
      <el-tooltip content="AI驱动的学习辅助工具" placement="top">
        <el-icon><QuestionFilled /></el-icon>
      </el-tooltip>
    </div>

    <div class="assistant-content">
      <el-tabs v-model="activeTab">
        <!-- 知识测试 -->
        <el-tab-pane label="知识测试" name="quiz">
          <div class="tab-content">
            <div v-if="!quizContent" class="action-panel">
              <el-button type="primary" @click="generateQuiz" :loading="loading">
                生成测试题
              </el-button>
              <div class="hint-text">
                基于当前知识点自动生成测试题，帮助你检验学习效果
              </div>
            </div>

            <div v-else class="quiz-container">
              <div v-html="formatQuizContent" class="quiz-content"></div>
              <div class="quiz-actions">
                <el-button @click="resetQuiz">重新生成</el-button>
                <el-button type="primary" @click="saveQuiz">保存测试</el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 概念解析 -->
        <el-tab-pane label="概念解析" name="explain">
          <div class="tab-content">
            <div v-if="!explanationContent" class="action-panel">
              <el-button type="primary" @click="explainConcept" :loading="loading">
                解析概念
              </el-button>
              <div class="hint-text">
                深入解释当前知识点，提供更多示例和关联信息
              </div>
            </div>

            <div v-else class="explanation-container">
              <div v-html="formatExplanation" class="explanation-content"></div>
              <div class="explanation-actions">
                <el-button @click="resetExplanation">重新解析</el-button>
                <el-button type="primary" @click="saveExplanation">
                  保存解析
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 知识总结 -->
        <el-tab-pane label="知识总结" name="summary">
          <div class="tab-content">
            <div v-if="!summaryContent" class="action-panel">
              <el-button type="primary" @click="generateSummary" :loading="loading">
                生成总结
              </el-button>
              <div class="hint-text">
                自动总结知识要点，提炼关键信息
              </div>
            </div>

            <div v-else class="summary-container">
              <div v-html="formatSummary" class="summary-content"></div>
              <div class="summary-actions">
                <el-button @click="resetSummary">重新总结</el-button>
                <el-button type="primary" @click="saveSummary">
                  保存总结
                </el-button>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 学习记录 -->
        <el-tab-pane label="学习记录" name="history">
          <div class="history-container">
            <el-timeline>
              <el-timeline-item
                v-for="record in studyHistory"
                :key="record.id"
                :timestamp="formatDate(record.timestamp)"
                :type="record.type === 'quiz' ? 'primary' : 'success'"
              >
                <div class="history-item">
                  <div class="history-title">
                    {{ getHistoryTitle(record.type) }}
                  </div>
                  <div class="history-content">
                    {{ record.summary }}
                  </div>
                  <div class="history-actions">
                    <el-button link type="primary" @click="viewHistoryDetail(record)">
                      查看详情
                    </el-button>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>

            <div v-if="studyHistory.length === 0" class="empty-history">
              <el-empty description="暂无学习记录" />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 历史记录详情对话框 -->
    <el-dialog
      v-model="historyDetailVisible"
      :title="getHistoryTitle(selectedRecord?.type)"
      width="60%"
    >
      <div v-if="selectedRecord" class="history-detail">
        <div class="detail-meta">
          <span>时间：{{ formatDate(selectedRecord.timestamp) }}</span>
          <span>知识点：{{ selectedRecord.nodeName }}</span>
        </div>
        <div class="detail-content" v-html="selectedRecord.content"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import marked from 'marked'

// State
const activeTab = ref('quiz')
const loading = ref(false)
const quizContent = ref('')
const explanationContent = ref('')
const summaryContent = ref('')
const historyDetailVisible = ref(false)
const selectedRecord = ref(null)

// Mock study history data
const studyHistory = ref([
  {
    id: 1,
    type: 'quiz',
    timestamp: new Date(2024, 2, 10),
    nodeName: '行政职业能力测验',
    summary: '完成了3道测试题，正确率67%',
    content: '测试题内容...'
  },
  {
    id: 2,
    type: 'explain',
    timestamp: new Date(2024, 2, 9),
    nodeName: '申论写作',
    summary: '深入理解了申论文章的结构要求',
    content: '解析内容...'
  }
])

// Computed
const formatQuizContent = computed(() => {
  return quizContent.value ? marked(quizContent.value) : ''
})

const formatExplanation = computed(() => {
  return explanationContent.value ? marked(explanationContent.value) : ''
})

const formatSummary = computed(() => {
  return summaryContent.value ? marked(summaryContent.value) : ''
})

// Methods
const generateQuiz = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/studyAssistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'generate_quiz',
        content: '当前知识点内容...' // 这里应该传入实际的知识点内容
      })
    })
    const data = await response.json()
    quizContent.value = data.quiz
  } catch (error) {
    ElMessage.error('生成测试题失败')
  } finally {
    loading.value = false
  }
}

const explainConcept = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/studyAssistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'explain_concept',
        content: '当前知识点内容...'
      })
    })
    const data = await response.json()
    explanationContent.value = data.explanation
  } catch (error) {
    ElMessage.error('概念解析失败')
  } finally {
    loading.value = false
  }
}

const generateSummary = async () => {
  loading.value = true
  try {
    const response = await fetch('/api/studyAssistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'generate_summary',
        content: '当前知识点内容...'
      })
    })
    const data = await response.json()
    summaryContent.value = data.summary
  } catch (error) {
    ElMessage.error('生成总结失败')
  } finally {
    loading.value = false
  }
}

const resetQuiz = () => {
  quizContent.value = ''
}

const resetExplanation = () => {
  explanationContent.value = ''
}

const resetSummary = () => {
  summaryContent.value = ''
}

const saveQuiz = () => {
  // 实现保存测试题的逻辑
  ElMessage.success('测试已保存')
}

const saveExplanation = () => {
  // 实现保存解析的逻辑
  ElMessage.success('解析已保存')
}

const saveSummary = () => {
  // 实现保存总结的逻辑
  ElMessage.success('总结已保存')
}

const viewHistoryDetail = (record) => {
  selectedRecord.value = record
  historyDetailVisible.value = true
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const getHistoryTitle = (type) => {
  switch (type) {
    case 'quiz': return '知识测试'
    case 'explain': return '概念解析'
    case 'summary': return '知识总结'
    default: return '学习记录'
  }
}
</script>

<style scoped>
.study-assistant {
  padding: 20px;
}

.assistant-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
}

.assistant-header h2 {
  margin: 0;
}

.tab-content {
  min-height: 400px;
  padding: 20px 0;
}

.action-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 0;
}

.hint-text {
  color: #666;
  font-size: 14px;
}

.quiz-content,
.explanation-content,
.summary-content {
  margin-bottom: 20px;
  line-height: 1.6;
}

.quiz-actions,
.explanation-actions,
.summary-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.history-container {
  padding: 20px 0;
}

.history-item {
  padding: 12px;
  background-color: var(--bg-color-light);
  border-radius: 4px;
}

.history-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.history-content {
  color: #666;
  font-size: 14px;
  margin-bottom: 8px;
}

.history-actions {
  display: flex;
  justify-content: flex-end;
}

.empty-history {
  padding: 40px 0;
}

.detail-meta {
  display: flex;
  gap: 20px;
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.detail-content {
  line-height: 1.6;
}
</style> 