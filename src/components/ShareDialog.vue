<template>
  <el-dialog
    v-model="dialogVisible"
    title="分享"
    width="30%"
  >
    <div class="share-content">
      <el-form :model="shareForm" label-width="80px">
        <el-form-item label="邮箱">
          <el-input v-model="shareForm.email" placeholder="请输入接收者邮箱" />
        </el-form-item>
        
        <el-form-item label="权限">
          <el-radio-group v-model="shareForm.permissions">
            <el-radio label="read">只读</el-radio>
            <el-radio label="write">可编辑</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <div class="shared-with">
        <h4>已分享给：</h4>
        <el-table :data="sharedUsers" style="width: 100%">
          <el-table-column prop="email" label="邮箱" />
          <el-table-column prop="permissions" label="权限">
            <template #default="{ row }">
              {{ row.permissions === 'read' ? '只读' : '可编辑' }}
            </template>
          </el-table-column>
          <el-table-column label="操作">
            <template #default="{ row }">
              <el-button 
                type="danger" 
                link
                @click="removeSharing(row)"
              >
                移除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="shareContent">
          分享
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  contentId: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const shareForm = ref({
  email: '',
  permissions: 'read'
})

const sharedUsers = ref([])

const fetchSharedUsers = async () => {
  try {
    const response = await fetch(`/api/share?id=${props.contentId}`)
    sharedUsers.value = await response.json()
  } catch (error) {
    ElMessage.error('获取分享信息失败')
  }
}

const shareContent = async () => {
  try {
    await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentId: props.contentId,
        ...shareForm.value
      })
    })
    ElMessage.success('分享成功')
    await fetchSharedUsers()
    shareForm.value.email = ''
  } catch (error) {
    ElMessage.error('分享失败')
  }
}

const removeSharing = async (sharing) => {
  try {
    await fetch(`/api/share/${sharing.id}`, { method: 'DELETE' })
    await fetchSharedUsers()
    ElMessage.success('已移除分享')
  } catch (error) {
    ElMessage.error('移除分享失败')
  }
}

onMounted(fetchSharedUsers)
</script>

<style scoped>
.share-content {
  margin-bottom: 20px;
}

.shared-with {
  margin-top: 20px;
}

.shared-with h4 {
  margin-bottom: 10px;
}
</style> 