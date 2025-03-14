<template>
  <div class="tag-manager">
    <div class="tag-header">
      <h3>标签管理</h3>
      <el-button type="primary" size="small" @click="showAddTagDialog">
        <el-icon><Plus /></el-icon> 新建标签
      </el-button>
    </div>

    <div class="tag-list">
      <el-tag
        v-for="tag in tags"
        :key="tag.id"
        :color="tag.color"
        class="tag-item"
        closable
        @close="deleteTag(tag)"
      >
        {{ tag.name }}
      </el-tag>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="新建标签"
      width="30%"
    >
      <el-form :model="newTag" label-width="80px">
        <el-form-item label="标签名称">
          <el-input v-model="newTag.name" />
        </el-form-item>
        <el-form-item label="标签颜色">
          <el-color-picker v-model="newTag.color" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="newTag.category">
            <el-option label="知识树" value="knowledge" />
            <el-option label="任务" value="task" />
            <el-option label="日志" value="journal" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createTag">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const tags = ref([])
const dialogVisible = ref(false)
const newTag = ref({
  name: '',
  color: '#409EFF',
  category: 'knowledge'
})

const fetchTags = async () => {
  try {
    const response = await fetch('/api/tags')
    tags.value = await response.json()
  } catch (error) {
    ElMessage.error('获取标签失败')
  }
}

const showAddTagDialog = () => {
  dialogVisible.value = true
  newTag.value = {
    name: '',
    color: '#409EFF',
    category: 'knowledge'
  }
}

const createTag = async () => {
  try {
    const response = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTag.value)
    })
    const result = await response.json()
    tags.value.push(result)
    dialogVisible.value = false
    ElMessage.success('标签创建成功')
  } catch (error) {
    ElMessage.error('创建标签失败')
  }
}

const deleteTag = async (tag) => {
  try {
    await fetch(`/api/tags/${tag.id}`, { method: 'DELETE' })
    tags.value = tags.value.filter(t => t.id !== tag.id)
    ElMessage.success('标签删除成功')
  } catch (error) {
    ElMessage.error('删除标签失败')
  }
}

onMounted(fetchTags)
</script>

<style scoped>
.tag-manager {
  padding: 16px;
}

.tag-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag-item {
  margin-right: 8px;
  margin-bottom: 8px;
}
</style> 