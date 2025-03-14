<template>
  <div class="learning-stats">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>学习时长统计</span>
              <el-select v-model="timeRange" size="small">
                <el-option label="本周" value="week" />
                <el-option label="本月" value="month" />
                <el-option label="本年" value="year" />
              </el-select>
            </div>
          </template>
          <div class="chart-container" ref="studyTimeChartRef"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card class="stat-card">
          <template #header>
            <div class="card-header">
              <span>知识点掌握度</span>
              <el-button-group size="small">
                <el-button :type="viewMode === 'chart' ? 'primary' : ''" @click="viewMode = 'chart'">图表</el-button>
                <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="viewMode = 'list'">列表</el-button>
              </el-button-group>
            </div>
          </template>
          <div v-if="viewMode === 'chart'" class="chart-container" ref="masteryChartRef"></div>
          <div v-else class="mastery-list">
            <div v-for="item in masteryData" :key="item.name" class="mastery-item">
              <span>{{ item.name }}</span>
              <div class="mastery-progress">
                <el-progress 
                  :percentage="item.value" 
                  :color="getMasteryColor(item.value)"
                />
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="review-reminder">
      <template #header>
        <div class="card-header">
          <span>复习提醒</span>
          <el-button type="primary" size="small" @click="showReviewSettings">
            设置提醒
          </el-button>
        </div>
      </template>
      
      <el-table :data="reviewTasks" style="width: 100%">
        <el-table-column prop="title" label="知识点" />
        <el-table-column prop="lastReview" label="上次复习" :formatter="formatDate" />
        <el-table-column prop="nextReview" label="下次复习" :formatter="formatDate" />
        <el-table-column prop="interval" label="复习间隔">
          <template #default="{ row }">
            {{ formatInterval(row.interval) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button-group>
              <el-button type="primary" size="small" @click="startReview(row)">
                开始复习
              </el-button>
              <el-button size="small" @click="adjustInterval(row)">
                调整间隔
              </el-button>
            </el-button-group>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 复习设置对话框 -->
    <el-dialog
      v-model="reviewSettingsVisible"
      title="复习提醒设置"
      width="500px"
    >
      <el-form :model="reviewSettings" label-width="100px">
        <el-form-item label="默认间隔">
          <el-select v-model="reviewSettings.defaultInterval" style="width: 100%">
            <el-option label="每天" value="1" />
            <el-option label="每3天" value="3" />
            <el-option label="每周" value="7" />
            <el-option label="每两周" value="14" />
            <el-option label="每月" value="30" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="提醒方式">
          <el-checkbox-group v-model="reviewSettings.notificationMethods">
            <el-checkbox label="browser">浏览器通知</el-checkbox>
            <el-checkbox label="email">邮件提醒</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item label="提醒时间">
          <el-time-picker
            v-model="reviewSettings.notificationTime"
            format="HH:mm"
            placeholder="选择时间"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="reviewSettingsVisible = false">取消</el-button>
          <el-button type="primary" @click="saveReviewSettings">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 状态
const timeRange = ref('week')
const viewMode = ref('chart')
const reviewSettingsVisible = ref(false)
const studyTimeChartRef = ref(null)
const masteryChartRef = ref(null)

// 图表实例
let studyTimeChart = null
let masteryChart = null

// 复习设置
const reviewSettings = ref({
  defaultInterval: '7',
  notificationMethods: ['browser'],
  notificationTime: new Date(2024, 0, 1, 9, 0)
})

// 模拟数据
const masteryData = [
  { name: '行测-言语理解', value: 85 },
  { name: '行测-数量关系', value: 70 },
  { name: '行测-判断推理', value: 75 },
  { name: '行测-资料分析', value: 90 },
  { name: '申论-归纳概括', value: 65 }
]

const reviewTasks = ref([
  {
    id: 1,
    title: '行测-数量关系',
    lastReview: new Date(2024, 2, 10),
    nextReview: new Date(2024, 2, 17),
    interval: 7
  },
  {
    id: 2,
    title: '申论-文章写作',
    lastReview: new Date(2024, 2, 12),
    nextReview: new Date(2024, 2, 15),
    interval: 3
  }
])

// 方法
const initCharts = () => {
  // 初始化学习时长图表
  studyTimeChart = echarts.init(studyTimeChartRef.value)
  const studyTimeOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: {
      type: 'value',
      name: '小时'
    },
    series: [
      {
        name: '学习时长',
        type: 'bar',
        data: [3, 4, 2, 5, 3, 6, 4],
        itemStyle: {
          color: '#409EFF'
        }
      }
    ]
  }
  studyTimeChart.setOption(studyTimeOption)

  // 初始化知识点掌握度图表
  masteryChart = echarts.init(masteryChartRef.value)
  const masteryOption = {
    tooltip: {
      trigger: 'item'
    },
    radar: {
      indicator: masteryData.map(item => ({
        name: item.name,
        max: 100
      }))
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: masteryData.map(item => item.value),
            name: '掌握度',
            itemStyle: {
              color: '#409EFF'
            }
          }
        ]
      }
    ]
  }
  masteryChart.setOption(masteryOption)
}

const getMasteryColor = (value) => {
  if (value >= 90) return '#67C23A'
  if (value >= 70) return '#409EFF'
  if (value >= 50) return '#E6A23C'
  return '#F56C6C'
}

const formatDate = (row, column) => {
  return new Date(row[column.property]).toLocaleDateString('zh-CN')
}

const formatInterval = (days) => {
  if (days === 1) return '每天'
  if (days === 7) return '每周'
  if (days === 30) return '每月'
  return `${days}天`
}

const showReviewSettings = () => {
  reviewSettingsVisible.value = true
}

const saveReviewSettings = () => {
  // 这里实现保存设置的逻辑
  ElMessage.success('设置已保存')
  reviewSettingsVisible.value = false
}

const startReview = (task) => {
  // 这里实现开始复习的逻辑
  ElMessage.success(`开始复习: ${task.title}`)
}

const adjustInterval = (task) => {
  // 这里实现调整复习间隔的逻辑
  ElMessage.info('调整复习间隔功能开发中')
}

// 生命周期钩子
onMounted(() => {
  initCharts()
  
  // 监听窗口大小变化，重绘图表
  window.addEventListener('resize', () => {
    studyTimeChart?.resize()
    masteryChart?.resize()
  })
})
</script>

<style scoped>
.learning-stats {
  padding: 20px;
}

.stat-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.mastery-list {
  max-height: 300px;
  overflow-y: auto;
}

.mastery-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid var(--border-color);
}

.mastery-item:last-child {
  border-bottom: none;
}

.mastery-progress {
  flex: 1;
  margin-left: 20px;
}

.review-reminder {
  margin-top: 20px;
}
</style> 