<template>
  <div class="learning-path">
    <div class="path-header">
      <h2>学习路径</h2>
      <el-button type="primary" @click="showCreateDialog">
        创建学习路径
      </el-button>
    </div>

    <div class="path-list" v-if="learningPaths.length > 0">
      <el-card v-for="path in learningPaths" :key="path._id" class="path-card">
        <template #header>
          <div class="path-card-header">
            <h3>{{ path.name }}</h3>
            <div class="path-actions">
              <el-button-group>
                <el-button 
                  type="primary" 
                  plain 
                  size="small"
                  @click="editPath(path)"
                >
                  编辑
                </el-button>
                <el-button 
                  type="danger" 
                  plain 
                  size="small"
                  @click="deletePath(path._id)"
                >
                  删除
                </el-button>
              </el-button-group>
            </div>
          </div>
        </template>

        <div class="path-info">
          <div class="path-description">{{ path.description }}</div>
          <div class="path-progress">
            <div class="progress-header">
              <span>学习进度</span>
              <span>{{ path.progress }}%</span>
            </div>
            <el-progress 
              :percentage="path.progress"
              :status="path.progress === 100 ? 'success' : ''"
            />
          </div>

          <div class="path-milestones">
            <div class="milestone-header">
              <h4>学习里程碑</h4>
              <el-button 
                link 
                type="primary"
                @click="addMilestone(path)"
              >
                添加里程碑
              </el-button>
            </div>
            <el-timeline>
              <el-timeline-item
                v-for="milestone in path.milestones"
                :key="milestone.id"
                :type="milestone.completed ? 'success' : 'primary'"
                :hollow="!milestone.completed"
                :timestamp="formatDate(milestone.plannedDate)"
              >
                <div class="milestone-item">
                  <div class="milestone-content">
                    <el-checkbox
                      v-model="milestone.completed"
                      @change="updateMilestone(path._id, milestone)"
                    >
                      {{ milestone.title }}
                    </el-checkbox>
                    <div class="milestone-desc">{{ milestone.description }}</div>
                  </div>
                  <div class="milestone-meta">
                    <el-tag size="small" :type="getMilestoneStatus(milestone)">
                      {{ getMilestoneStatusText(milestone) }}
                    </el-tag>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </el-card>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无学习路径">
        <el-button type="primary" @click="showCreateDialog">
          创建学习路径
        </el-button>
      </el-empty>
    </div>

    <!-- 创建/编辑路径对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editingPath ? '编辑学习路径' : '创建学习路径'"
      width="50%"
    >
      <el-form
        ref="pathForm"
        :model="pathForm"
        :rules="pathRules"
        label-width="100px"
      >
        <el-form-item label="路径名称" prop="name">
          <el-input v-model="pathForm.name" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="pathForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="预计周期" prop="duration">
          <el-input-number
            v-model="pathForm.duration"
            :min="1"
            :max="365"
          />
          <span class="unit-label">天</span>
        </el-form-item>

        <el-form-item label="难度等级" prop="difficulty">
          <el-rate
            v-model="pathForm.difficulty"
            :max="3"
            :texts="['入门', '进阶', '高级']"
            show-text
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="savePath">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 添加里程碑对话框 -->
    <el-dialog
      v-model="milestoneDialogVisible"
      title="添加里程碑"
      width="50%"
    >
      <el-form
        ref="milestoneForm"
        :model="milestoneForm"
        :rules="milestoneRules"
        label-width="100px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="milestoneForm.title" />
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="milestoneForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="计划完成" prop="plannedDate">
          <el-date-picker
            v-model="milestoneForm.plannedDate"
            type="date"
            placeholder="选择日期"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="milestoneDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="saveMilestone">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// State
const learningPaths = ref([])
const dialogVisible = ref(false)
const milestoneDialogVisible = ref(false)
const editingPath = ref(null)
const currentPathId = ref(null)

// Forms
const pathForm = reactive({
  name: '',
  description: '',
  duration: 30,
  difficulty: 1
})

const milestoneForm = reactive({
  title: '',
  description: '',
  plannedDate: null
})

// Form rules
const pathRules = {
  name: [
    { required: true, message: '请输入路径名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入路径描述', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请设置预计周期', trigger: 'blur' }
  ]
}

const milestoneRules = {
  title: [
    { required: true, message: '请输入里程碑标题', trigger: 'blur' }
  ],
  plannedDate: [
    { required: true, message: '请选择计划完成日期', trigger: 'blur' }
  ]
}

// Methods
const showCreateDialog = () => {
  editingPath.value = null
  Object.assign(pathForm, {
    name: '',
    description: '',
    duration: 30,
    difficulty: 1
  })
  dialogVisible.value = true
}

const editPath = (path) => {
  editingPath.value = path
  Object.assign(pathForm, {
    name: path.name,
    description: path.description,
    duration: path.duration,
    difficulty: path.difficulty
  })
  dialogVisible.value = true
}

const savePath = async () => {
  try {
    if (editingPath.value) {
      await fetch('/api/learningPath', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pathId: editingPath.value._id,
          ...pathForm
        })
      })
      ElMessage.success('学习路径已更新')
    } else {
      await fetch('/api/learningPath', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pathForm)
      })
      ElMessage.success('学习路径已创建')
    }
    dialogVisible.value = false
    fetchLearningPaths()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const deletePath = async (pathId) => {
  try {
    await ElMessageBox.confirm('确定要删除这个学习路径吗？', '警告', {
      type: 'warning'
    })
    
    await fetch(`/api/learningPath/${pathId}`, { method: 'DELETE' })
    ElMessage.success('学习路径已删除')
    fetchLearningPaths()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const addMilestone = (path) => {
  currentPathId.value = path._id
  Object.assign(milestoneForm, {
    title: '',
    description: '',
    plannedDate: null
  })
  milestoneDialogVisible.value = true
}

const saveMilestone = async () => {
  try {
    await fetch('/api/learningPath', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathId: currentPathId.value,
        milestone: {
          id: Date.now(),
          ...milestoneForm,
          completed: false
        }
      })
    })
    
    ElMessage.success('里程碑已添加')
    milestoneDialogVisible.value = false
    fetchLearningPaths()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const updateMilestone = async (pathId, milestone) => {
  try {
    await fetch('/api/learningPath', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pathId,
        milestoneId: milestone.id,
        completed: milestone.completed
      })
    })
    
    // Update path progress
    const path = learningPaths.value.find(p => p._id === pathId)
    if (path) {
      const totalMilestones = path.milestones.length
      const completedMilestones = path.milestones.filter(m => m.completed).length
      path.progress = Math.round((completedMilestones / totalMilestones) * 100)
    }
  } catch (error) {
    ElMessage.error('更新失败')
    milestone.completed = !milestone.completed // Revert change
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('zh-CN')
}

const getMilestoneStatus = (milestone) => {
  if (milestone.completed) return 'success'
  const now = new Date()
  const plannedDate = new Date(milestone.plannedDate)
  return now > plannedDate ? 'danger' : 'primary'
}

const getMilestoneStatusText = (milestone) => {
  if (milestone.completed) return '已完成'
  const now = new Date()
  const plannedDate = new Date(milestone.plannedDate)
  return now > plannedDate ? '已逾期' : '进行中'
}

// Fetch initial data
const fetchLearningPaths = async () => {
  try {
    const response = await fetch('/api/learningPath')
    learningPaths.value = await response.json()
  } catch (error) {
    ElMessage.error('获取学习路径失败')
  }
}

// Initialize
fetchLearningPaths()
</script>

<style scoped>
.learning-path {
  padding: 20px;
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.path-header h2 {
  margin: 0;
}

.path-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
}

.path-card {
  height: 100%;
}

.path-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.path-card-header h3 {
  margin: 0;
}

.path-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.path-description {
  color: #666;
  font-size: 14px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.milestone-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.milestone-header h4 {
  margin: 0;
}

.milestone-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.milestone-content {
  flex: 1;
}

.milestone-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #666;
}

.milestone-meta {
  margin-left: 16px;
}

.unit-label {
  margin-left: 8px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style> 