<template>
  <div class="learning-analytics">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>学习进度分布</span>
              <el-tooltip content="各类别知识点的完成情况" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="progressChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-header">
              <span>学习时间趋势</span>
              <el-tooltip content="每日学习时长统计" placement="top">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div ref="timeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="stats-card">
      <template #header>
        <div class="stats-header">
          <span>学习效果分析</span>
          <el-select v-model="timeRange" size="small">
            <el-option label="最近一周" value="week" />
            <el-option label="最近一月" value="month" />
            <el-option label="最近三月" value="quarter" />
          </el-select>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="8" v-for="stat in learningStats" :key="stat.title">
          <div class="stat-item">
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-title">{{ stat.title }}</div>
            <div class="stat-trend" :class="stat.trend > 0 ? 'up' : 'down'">
              {{ Math.abs(stat.trend) }}% 
              <el-icon>
                <CaretTop v-if="stat.trend > 0" />
                <CaretBottom v-else />
              </el-icon>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="performance-analysis">
        <h4>学习建议</h4>
        <div class="analysis-content">
          <el-timeline>
            <el-timeline-item
              v-for="(suggestion, index) in suggestions"
              :key="index"
              :type="suggestion.type"
            >
              {{ suggestion.content }}
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'
import { 
  InfoFilled, 
  CaretTop, 
  CaretBottom 
} from '@element-plus/icons-vue'

const progressChartRef = ref(null)
const timeChartRef = ref(null)
const timeRange = ref('week')
const progressChart = ref(null)
const timeChart = ref(null)

const learningStats = ref([
  {
    title: '知识点掌握率',
    value: '85%',
    trend: 5
  },
  {
    title: '日均学习时长',
    value: '2.5h',
    trend: -2
  },
  {
    title: '完成任务数',
    value: '28',
    trend: 12
  }
])

const suggestions = ref([
  {
    type: 'success',
    content: '您在数据结构领域的学习进展良好，建议继续保持'
  },
  {
    type: 'warning',
    content: '算法部分的练习频率较低，建议增加相关习题训练'
  },
  {
    type: 'info',
    content: '建议对已学知识点进行定期复习，巩固学习效果'
  }
])

const initCharts = () => {
  // 初始化进度分布图表
  progressChart.value = echarts.init(progressChartRef.value)
  const progressOption = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: [
          { value: 35, name: '已掌握' },
          { value: 45, name: '学习中' },
          { value: 20, name: '未开始' }
        ]
      }
    ]
  }
  progressChart.value.setOption(progressOption)

  // 初始化时间趋势图表
  timeChart.value = echarts.init(timeChartRef.value)
  const timeOption = {
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value',
      name: '学习时长(小时)'
    },
    series: [
      {
        data: [2.5, 3.0, 2.0, 3.5, 2.8, 1.5, 2.2],
        type: 'line',
        smooth: true,
        areaStyle: {}
      }
    ]
  }
  timeChart.value.setOption(timeOption)
}

const fetchAnalytics = async () => {
  try {
    const response = await fetch('/api/learningAnalytics')
    const data = await response.json()
    updateCharts(data)
  } catch (error) {
    console.error('Failed to fetch analytics:', error)
  }
}

const updateCharts = (data) => {
  // 更新图表数据
}

watch(timeRange, () => {
  fetchAnalytics()
})

onMounted(() => {
  initCharts()
  fetchAnalytics()

  window.addEventListener('resize', () => {
    progressChart.value?.resize()
    timeChart.value?.resize()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {
    progressChart.value?.resize()
    timeChart.value?.resize()
  })
})
</script>

<style scoped>
.learning-analytics {
  padding: 20px;
}

.chart-card {
  margin-bottom: 20px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: var(--el-bg-color-page);
  border-radius: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--el-color-primary);
}

.stat-title {
  margin: 8px 0;
  color: var(--el-text-color-regular);
}

.stat-trend {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.stat-trend.up {
  color: #67C23A;
}

.stat-trend.down {
  color: #F56C6C;
}

.performance-analysis {
  margin-top: 20px;
}

.analysis-content {
  margin-top: 16px;
}
</style> 