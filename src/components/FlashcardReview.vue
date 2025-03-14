<template>
  <div class="flashcard-review">
    <div class="review-header">
      <h2>闪卡复习</h2>
      <div class="review-stats">
        <el-tag>今日待复习: {{ todayCards }}</el-tag>
        <el-tag type="success">已掌握: {{ masteredCards }}</el-tag>
      </div>
    </div>

    <div class="flashcard-container" v-if="currentCard">
      <div 
        class="flashcard" 
        :class="{ flipped: isFlipped }"
        @click="flipCard"
      >
        <div class="flashcard-front">
          <div class="card-content">{{ currentCard.front }}</div>
          <div class="card-hint">点击查看答案</div>
        </div>
        <div class="flashcard-back">
          <div class="card-content">{{ currentCard.back }}</div>
          <div class="card-hint">点击返回问题</div>
        </div>
      </div>

      <div class="review-actions" v-if="isFlipped">
        <el-button-group>
          <el-button 
            type="danger" 
            @click="handleResult('again')"
          >
            重来
          </el-button>
          <el-button 
            type="warning" 
            @click="handleResult('hard')"
          >
            困难
          </el-button>
          <el-button 
            type="success" 
            @click="handleResult('good')"
          >
            掌握
          </el-button>
          <el-button 
            type="primary" 
            @click="handleResult('easy')"
          >
            简单
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="empty-state" v-else>
      <el-empty description="暂无需要复习的卡片">
        <el-button type="primary" @click="showCreateDialog">
          创建新卡片
        </el-button>
      </el-empty>
    </div>

    <!-- 创建新卡片对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="创建闪卡"
      width="50%"
    >
      <el-form 
        :model="newCard"
        label-position="top"
        @submit.prevent="createCard"
      >
        <el-form-item label="问题">
          <el-input 
            v-model="newCard.front"
            type="textarea"
            rows="3"
            placeholder="输入问题..."
          />
        </el-form-item>

        <el-form-item label="答案">
          <el-input
            v-model="newCard.back"
            type="textarea"
            rows="3"
            placeholder="输入答案..."
          />
        </el-form-item>

        <el-form-item label="分类">
          <el-select v-model="newCard.category" placeholder="选择分类">
            <el-option
              v-for="category in categories"
              :key="category.value"
              :label="category.label"
              :value="category.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="关联知识点">
          <el-tree-select
            v-model="newCard.nodeId"
            :data="knowledgeTreeData"
            placeholder="选择关联的知识点"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createCard">
            创建
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 复习完成对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="复习完成"
      width="30%"
    >
      <div class="complete-stats">
        <div class="stat-item">
          <div class="stat-label">复习数量</div>
          <div class="stat-value">{{ reviewStats.total }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">正确率</div>
          <div class="stat-value">{{ reviewStats.accuracy }}%</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">用时</div>
          <div class="stat-value">{{ formatDuration(reviewStats.duration) }}</div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="completeDialogVisible = false">关闭</el-button>
          <el-button type="primary" @click="startNewReview">
            继续复习
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useKnowledgeTreeStore } from '../stores/knowledgeTreeStore'
import { ElMessage } from 'element-plus'

const knowledgeTreeStore = useKnowledgeTreeStore()
const isFlipped = ref(false)
const currentCard = ref(null)
const cards = ref([])
const createDialogVisible = ref(false)
const completeDialogVisible = ref(false)
const reviewStartTime = ref(null)

const newCard = ref({
  front: '',
  back: '',
  category: '',
  nodeId: null
})

const reviewStats = ref({
  total: 0,
  correct: 0,
  duration: 0
})

const categories = [
  { label: '基础概念', value: 'basic' },
  { label: '重要公式', value: 'formula' },
  { label: '关键定理', value: 'theorem' },
  { label: '实践技巧', value: 'skill' }
]

const todayCards = computed(() => {
  return cards.value.length
})

const masteredCards = computed(() => {
  return cards.value.filter(card => card.level >= 5).length
})

const knowledgeTreeData = computed(() => {
  return knowledgeTreeStore.getTreeData
})

const fetchCards = async () => {
  try {
    const response = await fetch('/api/flashcards')
    cards.value = await response.json()
    if (cards.value.length > 0) {
      currentCard.value = cards.value[0]
      reviewStartTime.value = Date.now()
    }
  } catch (error) {
    ElMessage.error('获取闪卡失败')
  }
}

const flipCard = () => {
  isFlipped.value = !isFlipped.value
}

const handleResult = async (result) => {
  try {
    await fetch('/api/flashcards', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId: currentCard.value._id,
        result
      })
    })

    // 更新统计数据
    reviewStats.value.total++
    if (result === 'good' || result === 'easy') {
      reviewStats.value.correct++
    }

    // 移除当前卡片
    cards.value = cards.value.filter(card => card._id !== currentCard.value._id)

    // 检查是否完成复习
    if (cards.value.length === 0) {
      reviewStats.value.duration = (Date.now() - reviewStartTime.value) / 1000
      reviewStats.value.accuracy = Math.round(
        (reviewStats.value.correct / reviewStats.value.total) * 100
      )
      completeDialogVisible.value = true
    } else {
      currentCard.value = cards.value[0]
      isFlipped.value = false
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

const createCard = async () => {
  try {
    await fetch('/api/flashcards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCard.value)
    })
    
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    newCard.value = {
      front: '',
      back: '',
      category: '',
      nodeId: null
    }
    await fetchCards()
  } catch (error) {
    ElMessage.error('创建失败')
  }
}

const startNewReview = () => {
  completeDialogVisible.value = false
  fetchCards()
}

const formatDuration = (seconds) => {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.round(seconds % 60)
  return `${minutes}分${remainingSeconds}秒`
}

onMounted(fetchCards)
</script>

<style scoped>
.flashcard-review {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.review-stats {
  display: flex;
  gap: 10px;
}

.flashcard-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.flashcard {
  width: 100%;
  height: 300px;
  perspective: 1000px;
  cursor: pointer;
}

.flashcard-front,
.flashcard-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.flashcard-back {
  transform: rotateY(180deg);
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.card-content {
  font-size: 18px;
  text-align: center;
  margin-bottom: 20px;
}

.card-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.review-actions {
  margin-top: 20px;
}

.complete-stats {
  display: flex;
  justify-content: space-around;
  margin: 20px 0;
}

.stat-item {
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 5px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
}
</style> 