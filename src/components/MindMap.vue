<template>
  <div class="mind-map">
    <div class="mind-map-header">
      <h2>思维导图</h2>
      <div class="map-actions">
        <el-button-group>
          <el-button 
            :type="viewMode === 'tree' ? 'primary' : ''" 
            @click="viewMode = 'tree'"
          >
            树形图
          </el-button>
          <el-button 
            :type="viewMode === 'force' ? 'primary' : ''" 
            @click="viewMode = 'force'"
          >
            关系图
          </el-button>
        </el-button-group>
        <el-button-group>
          <el-button @click="zoomIn">
            <el-icon><ZoomIn /></el-icon>
          </el-button>
          <el-button @click="zoomOut">
            <el-icon><ZoomOut /></el-icon>
          </el-button>
          <el-button @click="resetZoom">
            <el-icon><FullScreen /></el-icon>
          </el-button>
        </el-button-group>
        <el-button type="primary" @click="exportImage">
          导出图片
        </el-button>
      </div>
    </div>

    <div class="map-container" ref="mapContainer">
      <div class="loading-overlay" v-if="loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        加载中...
      </div>
    </div>

    <!-- 节点详情抽屉 -->
    <el-drawer
      v-model="nodeDetailVisible"
      title="节点详情"
      size="30%"
    >
      <template v-if="selectedNode">
        <div class="node-detail">
          <h3>{{ selectedNode.name }}</h3>
          
          <div class="detail-section">
            <h4>基本信息</h4>
            <div class="detail-item">
              <span class="label">创建时间：</span>
              <span>{{ formatDate(selectedNode.createdAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">最后修改：</span>
              <span>{{ formatDate(selectedNode.updatedAt) }}</span>
            </div>
            <div class="detail-item">
              <span class="label">关联节点：</span>
              <span>{{ selectedNode.relations?.length || 0 }}</span>
            </div>
          </div>

          <div class="detail-section">
            <h4>节点内容</h4>
            <div class="node-content">{{ selectedNode.content }}</div>
          </div>

          <div class="detail-section">
            <h4>关联节点</h4>
            <el-tag
              v-for="relation in selectedNode.relations"
              :key="relation.id"
              class="relation-tag"
              @click="selectNode(relation.id)"
            >
              {{ relation.name }}
            </el-tag>
            <div v-if="!selectedNode.relations?.length" class="no-relations">
              暂无关联节点
            </div>
          </div>

          <div class="detail-actions">
            <el-button type="primary" @click="editNode">
              编辑节点
            </el-button>
            <el-button @click="addRelation">
              添加关联
            </el-button>
          </div>
        </div>
      </template>
    </el-drawer>

    <!-- 编辑节点对话框 -->
    <el-dialog
      v-model="editDialogVisible"
      :title="selectedNode ? '编辑节点' : '新建节点'"
      width="50%"
    >
      <el-form
        ref="nodeForm"
        :model="nodeForm"
        :rules="nodeRules"
        label-width="100px"
      >
        <el-form-item label="节点名称" prop="name">
          <el-input v-model="nodeForm.name" />
        </el-form-item>

        <el-form-item label="节点内容" prop="content">
          <el-input
            v-model="nodeForm.content"
            type="textarea"
            :rows="4"
          />
        </el-form-item>

        <el-form-item label="节点颜色">
          <el-color-picker v-model="nodeForm.color" />
        </el-form-item>

        <el-form-item label="关联节点">
          <el-select
            v-model="nodeForm.relations"
            multiple
            filterable
            placeholder="选择关联节点"
          >
            <el-option
              v-for="node in availableNodes"
              :key="node.id"
              :label="node.name"
              :value="node.id"
            />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveNode">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { 
  ZoomIn, 
  ZoomOut, 
  FullScreen, 
  Loading 
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import * as d3 from 'd3'

// State
const viewMode = ref('tree')
const loading = ref(false)
const mapContainer = ref(null)
const nodeDetailVisible = ref(false)
const editDialogVisible = ref(false)
const selectedNode = ref(null)
const svg = ref(null)
const simulation = ref(null)

// Form state
const nodeForm = ref({
  name: '',
  content: '',
  color: '#409EFF',
  relations: []
})

const nodeRules = {
  name: [
    { required: true, message: '请输入节点名称', trigger: 'blur' },
    { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  content: [
    { required: true, message: '请输入节点内容', trigger: 'blur' }
  ]
}

// Mock data
const mindMapData = ref({
  nodes: [
    { id: 1, name: '公务员考试', content: '考试概述...', color: '#409EFF' },
    { id: 2, name: '行测', content: '行测内容...', color: '#67C23A' },
    { id: 3, name: '申论', content: '申论内容...', color: '#E6A23C' },
    { id: 4, name: '面试', content: '面试内容...', color: '#F56C6C' }
  ],
  links: [
    { source: 1, target: 2 },
    { source: 1, target: 3 },
    { source: 1, target: 4 },
    { source: 2, target: 3 }
  ]
})

// Computed
const availableNodes = computed(() => {
  if (!selectedNode.value) return mindMapData.value.nodes
  return mindMapData.value.nodes.filter(node => node.id !== selectedNode.value.id)
})

// Methods
const initMindMap = () => {
  loading.value = true

  // Clear previous SVG
  if (mapContainer.value) {
    mapContainer.value.innerHTML = ''
  }

  // Create SVG
  const width = mapContainer.value.clientWidth
  const height = mapContainer.value.clientHeight

  svg.value = d3.select(mapContainer.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  // Add zoom behavior
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      container.attr('transform', event.transform)
    })

  svg.value.call(zoom)

  // Create container for nodes and links
  const container = svg.value.append('g')

  if (viewMode.value === 'tree') {
    renderTreeLayout(container, width, height)
  } else {
    renderForceLayout(container, width, height)
  }

  loading.value = false
}

const renderTreeLayout = (container, width, height) => {
  // Convert data to hierarchy
  const root = d3.hierarchy(convertToHierarchy(mindMapData.value))
    .sum(d => d.value)

  // Create tree layout
  const treeLayout = d3.tree()
    .size([height - 100, width - 200])

  const tree = treeLayout(root)

  // Draw links
  container.selectAll('path.link')
    .data(tree.links())
    .join('path')
    .attr('class', 'link')
    .attr('d', d3.linkHorizontal()
      .x(d => d.y)
      .y(d => d.x)
    )
    .attr('fill', 'none')
    .attr('stroke', '#999')

  // Draw nodes
  const nodes = container.selectAll('g.node')
    .data(tree.descendants())
    .join('g')
    .attr('class', 'node')
    .attr('transform', d => `translate(${d.y},${d.x})`)
    .on('click', (event, d) => showNodeDetail(d.data))

  nodes.append('circle')
    .attr('r', 8)
    .attr('fill', d => d.data.color || '#409EFF')

  nodes.append('text')
    .attr('dy', '0.31em')
    .attr('x', d => d.children ? -12 : 12)
    .attr('text-anchor', d => d.children ? 'end' : 'start')
    .text(d => d.data.name)
}

const renderForceLayout = (container, width, height) => {
  // Create force simulation
  simulation.value = d3.forceSimulation(mindMapData.value.nodes)
    .force('link', d3.forceLink(mindMapData.value.links)
      .id(d => d.id)
      .distance(100)
    )
    .force('charge', d3.forceManyBody().strength(-300))
    .force('center', d3.forceCenter(width / 2, height / 2))

  // Draw links
  const links = container.selectAll('line')
    .data(mindMapData.value.links)
    .join('line')
    .attr('stroke', '#999')
    .attr('stroke-width', 1)

  // Draw nodes
  const nodes = container.selectAll('g')
    .data(mindMapData.value.nodes)
    .join('g')
    .call(d3.drag()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended)
    )
    .on('click', (event, d) => showNodeDetail(d))

  nodes.append('circle')
    .attr('r', 8)
    .attr('fill', d => d.color)

  nodes.append('text')
    .attr('dx', 12)
    .attr('dy', '.35em')
    .text(d => d.name)

  // Update positions
  simulation.value.on('tick', () => {
    links
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y)

    nodes
      .attr('transform', d => `translate(${d.x},${d.y})`)
  })
}

const dragstarted = (event) => {
  if (!event.active) simulation.value.alphaTarget(0.3).restart()
  event.subject.fx = event.subject.x
  event.subject.fy = event.subject.y
}

const dragged = (event) => {
  event.subject.fx = event.x
  event.subject.fy = event.y
}

const dragended = (event) => {
  if (!event.active) simulation.value.alphaTarget(0)
  event.subject.fx = null
  event.subject.fy = null
}

const convertToHierarchy = (data) => {
  // Convert flat data to hierarchical structure
  const nodeMap = new Map(data.nodes.map(node => [node.id, { ...node, children: [] }]))
  
  data.links.forEach(link => {
    const parent = nodeMap.get(link.source)
    const child = nodeMap.get(link.target)
    if (parent && child) {
      parent.children.push(child)
    }
  })
  
  return nodeMap.get(1) // Assuming node with id 1 is the root
}

const showNodeDetail = (node) => {
  selectedNode.value = node
  nodeDetailVisible.value = true
}

const editNode = () => {
  Object.assign(nodeForm.value, {
    name: selectedNode.value.name,
    content: selectedNode.value.content,
    color: selectedNode.value.color,
    relations: selectedNode.value.relations?.map(r => r.id) || []
  })
  editDialogVisible.value = true
}

const saveNode = () => {
  // Validate form
  nodeForm.value.validate(valid => {
    if (valid) {
      // Update node data
      if (selectedNode.value) {
        Object.assign(selectedNode.value, {
          name: nodeForm.value.name,
          content: nodeForm.value.content,
          color: nodeForm.value.color,
          updatedAt: new Date()
        })
      } else {
        // Create new node
        const newNode = {
          id: Date.now(),
          name: nodeForm.value.name,
          content: nodeForm.value.content,
          color: nodeForm.value.color,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        mindMapData.value.nodes.push(newNode)
      }

      // Update relations
      updateRelations()

      editDialogVisible.value = false
      ElMessage.success('保存成功')
      initMindMap()
    }
  })
}

const updateRelations = () => {
  const nodeId = selectedNode.value?.id
  if (!nodeId) return

  // Remove old relations
  mindMapData.value.links = mindMapData.value.links.filter(
    link => link.source !== nodeId && link.target !== nodeId
  )

  // Add new relations
  nodeForm.value.relations.forEach(targetId => {
    mindMapData.value.links.push({
      source: nodeId,
      target: targetId
    })
  })
}

const addRelation = () => {
  editNode()
}

const zoomIn = () => {
  svg.value.transition().call(
    d3.zoom().scaleBy, 1.2
  )
}

const zoomOut = () => {
  svg.value.transition().call(
    d3.zoom().scaleBy, 0.8
  )
}

const resetZoom = () => {
  svg.value.transition().call(
    d3.zoom().transform,
    d3.zoomIdentity
  )
}

const exportImage = () => {
  // Convert SVG to image
  const svgData = new XMLSerializer().serializeToString(svg.value.node())
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  const img = new Image()

  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    ctx.drawImage(img, 0, 0)
    
    // Download image
    const link = document.createElement('a')
    link.download = 'mindmap.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('zh-CN')
}

// Lifecycle hooks
onMounted(() => {
  initMindMap()
  window.addEventListener('resize', initMindMap)
})

onUnmounted(() => {
  window.removeEventListener('resize', initMindMap)
  if (simulation.value) {
    simulation.value.stop()
  }
})

// Watch for view mode changes
watch(viewMode, () => {
  initMindMap()
})
</script>

<style scoped>
.mind-map {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.mind-map-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.mind-map-header h2 {
  margin: 0;
}

.map-actions {
  display: flex;
  gap: 12px;
}

.map-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.node-detail {
  padding: 20px;
}

.node-detail h3 {
  margin: 0 0 20px 0;
  color: var(--primary-color);
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
}

.detail-item .label {
  width: 80px;
  color: #666;
}

.node-content {
  background: var(--bg-color-light);
  padding: 12px;
  border-radius: 4px;
  line-height: 1.6;
}

.relation-tag {
  margin: 0 8px 8px 0;
  cursor: pointer;
}

.no-relations {
  color: #999;
  font-style: italic;
}

.detail-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}

:deep(.node) {
  cursor: pointer;
}

:deep(.node:hover circle) {
  filter: brightness(0.9);
}

:deep(.node text) {
  font-size: 12px;
}

:deep(.link) {
  stroke-width: 1.5px;
}
</style> 