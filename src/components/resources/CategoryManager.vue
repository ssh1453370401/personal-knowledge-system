<template>
  <div class="category-manager">
    <el-dialog
      v-model="dialogVisible"
      title="分类管理"
      width="500px"
    >
      <div class="category-content">
        <div class="category-list">
          <el-table
            :data="categories"
            style="width: 100%"
            :max-height="400"
          >
            <el-table-column prop="name" label="分类名称">
              <template #default="{ row }">
                <template v-if="row.id === editingId">
                  <el-input
                    v-model="editingName"
                    size="small"
                    @keyup.enter="saveCategory"
                    @blur="saveCategory"
                  />
                </template>
                <span v-else>{{ row.name }}</span>
              </template>
            </el-table-column>
            
            <el-table-column prop="count" label="资源数量" width="100" />
            
            <el-table-column label="操作" width="150" align="right">
              <template #default="{ row }">
                <el-button-group>
                  <el-button
                    link
                    type="primary"
                    :icon="Edit"
                    @click="startEdit(row)"
                  />
                  <el-button
                    link
                    type="danger"
                    :icon="Delete"
                    @click="deleteCategory(row)"
                  />
                </el-button-group>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="category-form">
          <el-form :model="newCategory" inline>
            <el-form-item>
              <el-input
                v-model="newCategory.name"
                placeholder="输入新分类名称"
                @keyup.enter="addCategory"
              >
                <template #append>
                  <el-button @click="addCategory">添加</el-button>
                </template>
              </el-input>
            </el-form-item>
          </el-form>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Edit, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  visible: Boolean,
  categories: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['update:visible', 'add', 'update', 'delete'])

const dialogVisible = ref(false)
const editingId = ref(null)
const editingName = ref('')
const newCategory = ref({ name: '' })

// 监听对话框可见性
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

watch(() => dialogVisible.value, (newVal) => {
  emit('update:visible', newVal)
  if (!newVal) {
    resetForm()
  }
})

// 开始编辑
const startEdit = (category) => {
  editingId.value = category.id
  editingName.value = category.name
}

// 保存分类
const saveCategory = () => {
  if (!editingName.value.trim()) {
    ElMessage.warning('分类名称不能为空')
    return
  }

  emit('update', {
    id: editingId.value,
    name: editingName.value.trim()
  })

  editingId.value = null
  editingName.value = ''
  ElMessage.success('分类已更新')
}

// 添加分类
const addCategory = () => {
  const name = newCategory.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入分类名称')
    return
  }

  emit('add', { name })
  newCategory.value.name = ''
  ElMessage.success('分类已添加')
}

// 删除分类
const deleteCategory = (category) => {
  ElMessageBox.confirm(
    '确定要删除这个分类吗？相关资源将被移动到默认分类。',
    '警告',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    emit('delete', category)
    ElMessage.success('分类已删除')
  })
}

// 重置表单
const resetForm = () => {
  editingId.value = null
  editingName.value = ''
  newCategory.value.name = ''
}
</script>

<style scoped>
.category-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.category-list {
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.category-form {
  display: flex;
  justify-content: center;
}
</style> 