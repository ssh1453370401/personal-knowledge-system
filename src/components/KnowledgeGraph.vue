<template>
  <div class="knowledge-graph">
    <div class="graph-toolbar">
      <el-button-group>
        <el-button 
          :type="viewMode === 'force' ? 'primary' : 'default'"
          @click="viewMode = 'force'"
        >
          力导向图
        </el-button>
        <el-button 
          :type="viewMode === 'tree' ? 'primary' : 'default'"
          @click="viewMode = 'tree'"
        >
          树形图
        </el-button>
      </el-button-group>

      <el-select v-model="selectedCategory" placeholder="选择分类">
        <el-option
          v-for="category in categories"
          :key="category.value"
          :label="category.label"
          :value="category.value"
        />
      </el-select>
    </div>

    <div ref="graphContainer" class="graph-container"></div>

    <el-drawer
      v-model="drawerVisible"
      title="节点详情"
      direction="rtl"
      size="30%"
    >
      <div v-if="selectedNode" class="node-details">
        <h3>{{ selectedNode.name }}</h3>
        <p>分类：{{ selectedNode.category }}</p>
        <p>关联数：{{ selectedNode.value }}</p>
        
        <h4>相关节点</h4>
        <el-table :data="relatedNodes" style="width: 100%">
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="strength" label="关联强度" />
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const graphContainer = ref(null)
const chart = ref(null)
const viewMode = ref('force')
const selectedCategory = ref('')
const drawerVisible = ref(false)
const selectedNode = ref(null)
const relatedNodes = ref([])

const categories = [
  { label: '全部', value: '' },
  { label: '基础知识', value: 'basic' },
  { label: '重要概念', value: 'concept' },
  { label: '实践技能', value: 'skill' }
]

const fetchGraphData = async () => {
  try {
    const response = await fetch('/api/knowledgeGraph')
    const data = await response.json()
    renderGraph(data)
  } catch (error) {
    console.error('Failed to fetch graph data:', error)
  }
}

const renderGraph = (data) => {
  if (!chart.value) {
    chart.value = echarts.init(graphContainer.value)
  }

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c}'
    },
    legend: {
      data: categories.map(c => c.label)
    },
    series: [{
      type: viewMode.value === 'force' ? 'graph' : 'tree',
      layout: viewMode.value === 'force' ? 'force' : 'orthogonal',
      data: data.nodes,
      links: data.links,
      categories: categories,
      roam: true,
      label: {
        show: true,
        position: 'right'
      },
      force: {
        repulsion: 100
      },
      emphasis: {
        focus: 'adjacency'
      }
    }]
  }

  chart.value.setOption(option)
  
  chart.value.on('click', 'series.graph.nodes', (params) => {
    selectedNode.value = params.data
    fetchRelatedNodes(params.data.id)
    drawerVisible.value = true
  })
}

const fetchRelatedNodes = async (nodeId) => {
  try {
    const response = await fetch(`/api/knowledgeGraph/related/${nodeId}`)
    relatedNodes.value = await response.json()
  } catch (error) {
    console.error('Failed to fetch related nodes:', error)
  }
}

watch([viewMode, selectedCategory], () => {
  fetchGraphData()
})

onMounted(() => {
  fetchGraphData()
})

onUnmounted(() => {
  if (chart.value) {
    chart.value.dispose()
  }
})
</script>

<style scoped>
.knowledge-graph {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.graph-toolbar {
  padding: 16px;
  display: flex;
  gap: 16px;
  align-items: center;
}

.graph-container {
  flex: 1;
  min-height: 500px;
}

.node-details {
  padding: 16px;
}
</style> 