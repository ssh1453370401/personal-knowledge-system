<template>
  <div class="study-timer">
    <el-card>
      <template #header>
        <div class="timer-header">
          <span>学习计时器</span>
          <el-tag :type="isRunning ? 'success' : 'info'">
            {{ isRunning ? '学习中' : '已暂停' }}
          </el-tag>
        </div>
      </template>

      <div class="timer-display">
        <div class="time">{{ formatTime(currentTime) }}</div>
        <div class="controls">
          <el-button-group>
            <el-button 
              :type="isRunning ? 'danger' : 'primary'"
              @click="toggleTimer"
            >
              {{ isRunning ? '暂停' : '开始' }}
            </el-button>
            <el-button @click="resetTimer" :disabled="isRunning">
              重置
            </el-button>
          </el-button-group>
        </div>
      </div>

      <div class="timer-info" v-if="isRunning">
        <p>当前学习：{{ currentNode?.label || '未选择知识点' }}</p>
        <p>开始时间：{{ formatDateTime(startTime) }}</p>
      </div>

      <div class="timer-settings" v-if="!isRunning">
        <el-form :model="timerSettings" label-position="top">
          <el-form-item label="选择知识点">
            <el-select 
              v-model="timerSettings.nodeId"
              filterable
              placeholder="请选择要学习的知识点"
            >
              <el-option
                v-for="node in availableNodes"
                :key="node.id"
                :label="node.label"
                :value="node.id"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="计划学习时长">
            <el-input-number 
              v-model="timerSettings.plannedDuration"
              :min="5"
              :max="180"
              :step="5"
            />
            <span class="unit">分钟</span>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <!-- 学习完成对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="学习完成"
      width="30%"
    >
      <div class="complete-content">
        <p>本次学习时长：{{ formatTime(currentTime) }}</p>
        <el-rate
          v-model="completionData.rating"
          show-text
          :texts="['很差', '一般', '良好', '优秀', '完美']"
        />
        <el-input
          v-model="completionData.notes"
          type="textarea"
          rows="3"
          placeholder="记录一下学习心得..."
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="completeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitCompletion">
            完成
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useKnowledgeTreeStore } from '../stores/knowledgeTreeStore'
import { ElMessage } from 'element-plus'

const knowledgeTreeStore = useKnowledgeTreeStore()
const isRunning = ref(false)
const currentTime = ref(0)
const startTime = ref(null)
const timer = ref(null)
const completeDialogVisible = ref(false)

const timerSettings = ref({
  nodeId: null,
  plannedDuration: 30
})

const completionData = ref({
  rating: 3,
  notes: ''
})

const availableNodes = computed(() => {
  return knowledgeTreeStore.getAllNodes()
})

const currentNode = computed(() => {
  return knowledgeTreeStore.getNodeById(timerSettings.value.nodeId)
})

const formatTime = (time) => {
  const hours = Math.floor(time / 3600)
  const minutes = Math.floor((time % 3600) / 60)
  const seconds = time % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const toggleTimer = () => {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

const startTimer = () => {
  if (!timerSettings.value.nodeId) {
    ElMessage.warning('请先选择要学习的知识点')
    return
  }

  isRunning.value = true
  startTime.value = new Date()
  timer.value = setInterval(() => {
    currentTime.value++
    
    // 检查是否达到计划时长
    if (currentTime.value >= timerSettings.value.plannedDuration * 60) {
      pauseTimer()
      completeDialogVisible.value = true
    }
  }, 1000)
}

const pauseTimer = () => {
  isRunning.value = false
  clearInterval(timer.value)
}

const resetTimer = () => {
  currentTime.value = 0
  startTime.value = null
  completionData.value = {
    rating: 3,
    notes: ''
  }
}

const submitCompletion = async () => {
  try {
    await fetch('/api/trackStudyTime', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: timerSettings.value.nodeId,
        startTime: startTime.value,
        endTime: new Date(),
        duration: currentTime.value,
        rating: completionData.value.rating,
        notes: completionData.value.notes
      })
    })
    
    ElMessage.success('学习记录已保存')
    completeDialogVisible.value = false
    resetTimer()
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})
</script>

<style scoped>
.study-timer {
  max-width: 400px;
  margin: 0 auto;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.timer-display {
  text-align: center;
  margin: 20px 0;
}

.time {
  font-size: 48px;
  font-weight: bold;
  font-family: monospace;
  margin-bottom: 16px;
}

.timer-info {
  margin: 16px 0;
  color: var(--el-text-color-regular);
}

.timer-settings {
  margin-top: 16px;
}

.unit {
  margin-left: 8px;
}

.complete-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style> 