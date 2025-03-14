<template>
  <div class="goal-manager">
    <div class="goal-header">
      <h2>学习目标</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 新建目标
      </el-button>
    </div>

    <div class="goal-content">
      <el-tabs v-model="activeTab">
        <!-- 进行中的目标 -->
        <el-tab-pane label="进行中" name="active">
          <div class="goal-list">
            <el-card 
              v-for="goal in activeGoals" 
              :key="goal.id" 
              class="goal-card"
            >
              <template #header>
                <div class="goal-card-header">
                  <h3>{{ goal.title }}</h3>
                  <div class="goal-actions">
                    <el-button-group>
                      <el-button 
                        link 
                        type="primary"
                        @click="editGoal(goal)"
                      >
                        编辑
                      </el-button>
                      <el-button 
                        link 
                        type="success"
                        @click="completeGoal(goal)"
                      >
                        完成
                      </el-button>
                    </el-button-group>
                  </div>
                </div>
              </template>

              <div class="goal-info">
                <div class="goal-progress">
                  <div class="progress-header">
                    <span>完成进度</span>
                    <span>{{ goal.progress }}%</span>
                  </div>
                  <el-progress 
                    :percentage="goal.progress"
                    :status="getProgressStatus(goal)"
                  />
                </div>

                <div class="goal-details">
                  <div class="detail-item">
                    <span class="label">开始时间：</span>
                    <span>{{ formatDate(goal.startDate) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">目标期限：</span>
                    <span>{{ formatDate(goal.endDate) }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="label">优先级：</span>
                    <el-tag :type="getPriorityType(goal.priority)">
                      {{ goal.priority }}
                    </el-tag>
                  </div>
                </div>

                <div class="goal-milestones">
                  <h4>里程碑</h4>
                  <el-timeline>
                    <el-timeline-item
                      v-for="milestone in goal.milestones"
                      :key="milestone.id"
                      :type="milestone.completed ? 'success' : ''"
                      :timestamp="formatDate(milestone.date)"
                    >
                      <div class="milestone-item">
                        <el-checkbox
                          v-model="milestone.completed"
                          @change="updateMilestone(goal, milestone)"
                        >
                          {{ milestone.title }}
                        </el-checkbox>
                      </div>
                    </el-timeline-item>
                  </el-timeline>
                </div>
              </div>
            </el-card>

            <div v-if="activeGoals.length === 0" class="empty-state">
              <el-empty description="暂无进行中的目标" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 已完成的目标 -->
        <el-tab-pane label="已完成" name="completed">
          <div class="goal-list">
            <el-card 
              v-for="goal in completedGoals" 
              :key="goal.id" 
              class="goal-card completed"
            >
              <template #header>
                <div class="goal-card-header">
                  <h3>{{ goal.title }}</h3>
                  <el-tag type="success">已完成</el-tag>
                </div>
              </template>

              <div class="goal-info">
                <div class="goal-summary">
                  <div class="summary-item">
                    <span class="label">完成用时：</span>
                    <span>{{ calculateDuration(goal) }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="label">完成日期：</span>
                    <span>{{ formatDate(goal.completedDate) }}</span>
                  </div>
                </div>

                <div class="goal-review" v-if="goal.review">
                  <h4>总结反思</h4>
                  <p>{{ goal.review }}</p>
                </div>
              </div>
            </el-card>

            <div v-if="completedGoals.length === 0" class="empty-state">
              <el-empty description="暂无已完成的目标" />
            </div>
          </div>
        </el-tab-pane>

        <!-- 目标统计 -->
        <el-tab-pane label="统计分析" name="stats">
          <div class="goal-stats">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="stat-card">
                  <template #header>
                    <div class="stat-header">
                      <span>目标完成率</span>
                      <el-tooltip content="已完成目标占总目标的比例">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-value">{{ completionRate }}%</div>
                    <el-progress
                      type="dashboard"
                      :percentage="completionRate"
                      :color="getCompletionRateColor"
                    />
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="stat-card">
                  <template #header>
                    <div class="stat-header">
                      <span>平均完成时间</span>
                      <el-tooltip content="目标平均完成所需天数">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-value">{{ averageCompletionDays }}天</div>
                    <div class="stat-chart" ref="completionTimeChart"></div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="stat-card">
                  <template #header>
                    <div class="stat-header">
                      <span>目标分布</span>
                      <el-tooltip content="不同类型目标的分布情况">
                        <el-icon><QuestionFilled /></el-icon>
                      </el-tooltip>
                    </div>
                  </template>
                  <div class="stat-content">
                    <div class="stat-chart" ref="distributionChart"></div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="trend-card">
              <template #header>
                <div class="stat-header">
                  <span>目标完成趋势</span>
                  <el-select v-model="trendPeriod" size="small">
                    <el-option label="近7天" value="week" />
                    <el-option label="近30天" value="month" />
                    <el-option label="近12个月" value="year" />
                  </el-select>
                </div>
              </template>
              <div class="trend-chart" ref="trendChart"></div>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 创建/编辑目标对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingGoal ? '编辑目标' : '创建目标'"
      width="50%"
    >
      <el-form
        ref="goalForm"
        :model="goalForm"
        :rules="goalRules"
        label-width="100px"
      >
        <el-form-item label="目标名称" prop="title">
          <el-input v-model="goalForm.title" />
        </el-form-item>

        <el-form-item label="目标描述" prop="description">
          <el-input
            v-model="goalForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="时间范围" required>
          <el-date-picker
            v-model="goalForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
          />
        </el-form-item>

        <el-form-item label="优先级" prop="priority">
          <el-select v-model="goalForm.priority">
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>

        <el-form-item label="里程碑">
          <div class="milestone-list">
            <div
              v-for="(milestone, index) in goalForm.milestones"
              :key="index"
              class="milestone-form-item"
            >
              <el-input v-model="milestone.title" placeholder="里程碑名称" />
              <el-date-picker
                v-model="milestone.date"
                type="date"
                placeholder="完成日期"
              />
              <el-button 
                type="danger" 
                circle
                @click="removeMilestone(index)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button link type="primary" @click="addMilestone">
              <el-icon><Plus /></el-icon> 添加里程碑
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveGoal">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 完成目标对话框 -->
    <el-dialog
      v-model="completeDialogVisible"
      title="完成目标"
      width="40%"
    >
      <el-form :model="completeForm">
        <el-form-item label="完成总结">
          <el-input
            v-model="completeForm.review"
            type="textarea"
            :rows="4"
            placeholder="记录一下完成这个目标的心得体会..."
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="completeDialogVisible = false">取消</el-button>
          <el-button type="success" @click="confirmComplete">
            确认完成
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { 
  Plus, 
  Delete, 
  QuestionFilled 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// State
const activeTab = ref('active')
const dialogVisible = ref(false)
const completeDialogVisible = ref(false)
const editingGoal = ref(null)
const completingGoal = ref(null)
const trendPeriod = ref('month')

// Charts refs
const completionTimeChart = ref(null)
const distributionChart = ref(null)
const trendChart = ref(null)

// Forms
const goalForm = ref({
  title: '',
  description: '',
  dateRange: [],
  priority: 'medium',
  milestones: []
})

const completeForm = ref({
  review: ''
})

const goalRules = {
  title: [
    { required: true, message: '请输入目标名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入目标描述', trigger: 'blur' }
  ]
}

// Mock data
const goals = ref([
  {
    id: 1,
    title: '完成行测全科目复习',
    description: '系统复习行测五个部分的内容',
    startDate: new Date(2024, 2, 1),
    endDate: new Date(2024, 3, 30),
    priority: 'high',
    progress: 60,
    milestones: [
      {
        id: 1,
        title: '完成言语理解模块',
        date: new Date(2024, 2, 10),
        completed: true
      },
      {
        id: 2,
        title: '完成数量关系模块',
        date: new Date(2024, 2, 20),
        completed: true
      },
      {
        id: 3,
        title: '完成判断推理模块',
        date: new Date(2024, 3, 1),
        completed: false
      }
    ]
  },
  {
    id: 2,
    title: '申论写作技巧提升',
    description: '提高申论文章的写作水平',
    startDate: new Date(2024, 2, 15),
    endDate: new Date(2024, 4, 15),
    priority: 'medium',
    progress: 30,
    milestones: [
      {
        id: 1,
        title: '掌握文章结构框架',
        date: new Date(2024, 2, 25),
        completed: true
      },
      {
        id: 2,
        title: '积累常用素材',
        date: new Date(2024, 3, 15),
        completed: false
      }
    ]
  }
])

// Computed
const activeGoals = computed(() => {
  return goals.value.filter(goal => !goal.completedDate)
})

const completedGoals = computed(() => {
  return goals.value.filter(goal => goal.completedDate)
})

const completionRate = computed(() => {
  const total = goals.value.length
  const completed = completedGoals.value.length
  return total > 0 ? Math.round((completed / total) * 100) : 0
})

const averageCompletionDays = computed(() => {
  const completedGoals = goals.value.filter(goal => goal.completedDate)
  if (completedGoals.length === 0) return 0

  const totalDays = completedGoals.reduce((sum, goal) => {
    const days = Math.ceil(
      (new Date(goal.completedDate) - new Date(goal.startDate)) / (1000 * 60 * 60 * 24)
    )
    return sum + days
  }, 0)

  return Math.round(totalDays / completedGoals.length)
})

const getCompletionRateColor = computed(() => {
  const rate = completionRate.value
  if (rate < 30) return '#F56C6C'
  if (rate < 70) return '#E6A23C'
  return '#67C23A'
})

// Methods
const showCreateDialog = () => {
  editingGoal.value = null
  goalForm.value = {
    title: '',
    description: '',
    dateRange: [],
    priority: 'medium',
    milestones: []
  }
  dialogVisible.value = true
}

const editGoal = (goal) => {
  editingGoal.value = goal
  goalForm.value = {
    title: goal.title,
    description: goal.description,
    dateRange: [goal.startDate, goal.endDate],
    priority: goal.priority,
    milestones: [...goal.milestones]
  }
  dialogVisible.value = true
}

const saveGoal = () => {
  if (editingGoal.value) {
    // Update existing goal
    Object.assign(editingGoal.value, {
      title: goalForm.value.title,
      description: goalForm.value.description,
      startDate: goalForm.value.dateRange[0],
      endDate: goalForm.value.dateRange[1],
      priority: goalForm.value.priority,
      milestones: goalForm.value.milestones
    })
    ElMessage.success('目标已更新')
  } else {
    // Create new goal
    const newGoal = {
      id: Date.now(),
      title: goalForm.value.title,
      description: goalForm.value.description,
      startDate: goalForm.value.dateRange[0],
      endDate: goalForm.value.dateRange[1],
      priority: goalForm.value.priority,
      progress: 0,
      milestones: goalForm.value.milestones
    }
    goals.value.push(newGoal)
    ElMessage.success('目标已创建')
  }
  dialogVisible.value = false
}

const addMilestone = () => {
  goalForm.value.milestones.push({
    id: Date.now(),
    title: '',
    date: null,
    completed: false
  })
}

const removeMilestone = (index) => {
  goalForm.value.milestones.splice(index, 1)
}

const completeGoal = (goal) => {
  completingGoal.value = goal
  completeForm.value.review = ''
  completeDialogVisible.value = true
}

const confirmComplete = () => {
  if (completingGoal.value) {
    completingGoal.value.completedDate = new Date()
    completingGoal.value.review = completeForm.value.review
    completingGoal.value.progress = 100
    ElMessage.success('目标已完成')
  }
  completeDialogVisible.value = false
}

const updateMilestone = (goal, milestone) => {
  // Update goal progress based on completed milestones
  const totalMilestones = goal.milestones.length
  const completedMilestones = goal.milestones.filter(m => m.completed).length
  goal.progress = Math.round((completedMilestones / totalMilestones) * 100)
}

const getProgressStatus = (goal) => {
  const now = new Date()
  const endDate = new Date(goal.endDate)
  if (goal.progress === 100) return 'success'
  if (now > endDate) return 'exception'
  return ''
}

const getPriorityType = (priority) => {
  switch (priority) {
    case 'high': return 'danger'
    case 'medium': return 'warning'
    case 'low': return ''
    default: return ''
  }
}

const calculateDuration = (goal) => {
  const start = new Date(goal.startDate)
  const end = new Date(goal.completedDate)
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
  return `${days}天`
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

// Chart initialization
const initCharts = () => {
  // Completion time distribution chart
  const timeChart = echarts.init(completionTimeChart.value)
  timeChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { value: 30, name: '0-30天' },
          { value: 45, name: '31-60天' },
          { value: 25, name: '60天以上' }
        ]
      }
    ]
  })

  // Goal distribution chart
  const distributionChart = echarts.init(distributionChart.value)
  distributionChart.setOption({
    tooltip: {
      trigger: 'item'
    },
    series: [
      {
        type: 'pie',
        radius: '50%',
        data: [
          { value: 40, name: '行测' },
          { value: 30, name: '申论' },
          { value: 30, name: '面试' }
        ]
      }
    ]
  })

  // Trend chart
  const trend = echarts.init(trendChart.value)
  trend.setOption({
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [20, 32, 41, 54, 60, 75, 85],
        type: 'line',
        smooth: true
      }
    ]
  })
}

// Lifecycle hooks
onMounted(() => {
  initCharts()
})
</script>

<style scoped>
.goal-manager {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.goal-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.goal-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.goal-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.goal-card {
  height: 100%;
}

.goal-card.completed {
  opacity: 0.8;
}

.goal-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.goal-card-header h3 {
  margin: 0;
  font-size: 16px;
}

.goal-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.goal-progress {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.goal-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  align-items: center;
}

.detail-item .label {
  width: 80px;
  color: #666;
}

.goal-milestones {
  margin-top: 16px;
}

.goal-milestones h4 {
  margin: 0 0 12px 0;
}

.milestone-item {
  margin-bottom: 8px;
}

.goal-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.goal-review {
  margin-top: 16px;
}

.goal-review h4 {
  margin: 0 0 8px 0;
}

.goal-stats {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stat-card {
  height: 100%;
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary-color);
  margin-bottom: 16px;
}

.stat-chart {
  height: 200px;
  width: 100%;
}

.trend-card {
  margin-top: 20px;
}

.trend-chart {
  height: 300px;
}

.milestone-form-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.empty-state {
  padding: 40px 0;
}
</style> 