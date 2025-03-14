<template>
  <div class="resource-upload">
    <el-dialog
      v-model="dialogVisible"
      title="上传资源"
      width="500px"
    >
      <el-form :model="uploadForm" :rules="rules" ref="uploadFormRef" label-width="80px">
        <el-form-item label="文件" prop="file">
          <el-upload
            class="upload-area"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :limit="1"
          >
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              拖拽文件到此处或 <em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持的文件类型：PDF、Word、PPT、图片等
              </div>
            </template>
          </el-upload>
        </el-form-item>

        <el-form-item label="名称" prop="name">
          <el-input v-model="uploadForm.name" placeholder="请输入资源名称" />
        </el-form-item>

        <el-form-item label="分类" prop="categoryId">
          <el-select 
            v-model="uploadForm.categoryId"
            placeholder="请选择分类"
            style="width: 100%"
          >
            <el-option
              v-for="category in categories"
              :key="category.id"
              :label="category.name"
              :value="category.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签">
          <el-select
            v-model="uploadForm.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请选择或创建标签"
            style="width: 100%"
          >
            <el-option
              v-for="tag in availableTags"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="uploadForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入资源描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeDialog">取消</el-button>
          <el-button type="primary" @click="submitUpload" :loading="uploading">
            确认上传
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  visible: Boolean,
  categories: {
    type: Array,
    default: () => []
  },
  availableTags: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:visible', 'upload-success'])

const dialogVisible = ref(false)
const uploading = ref(false)
const uploadFormRef = ref(null)

const uploadForm = ref({
  file: null,
  name: '',
  categoryId: null,
  tags: [],
  description: ''
})

const rules = {
  file: [
    { required: true, message: '请选择要上传的文件', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入资源名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  categoryId: [
    { required: true, message: '请选择分类', trigger: 'change' }
  ]
}

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

const handleFileChange = (file) => {
  uploadForm.value.file = file
  if (!uploadForm.value.name) {
    uploadForm.value.name = file.name.split('.')[0]
  }
}

const handleFileRemove = () => {
  uploadForm.value.file = null
}

const submitUpload = async () => {
  if (!uploadFormRef.value) return
  
  await uploadFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        uploading.value = true
        
        // 这里应该调用实际的上传API
        // const formData = new FormData()
        // formData.append('file', uploadForm.value.file.raw)
        // formData.append('name', uploadForm.value.name)
        // formData.append('categoryId', uploadForm.value.categoryId)
        // formData.append('tags', JSON.stringify(uploadForm.value.tags))
        // formData.append('description', uploadForm.value.description)
        // const response = await uploadAPI(formData)

        // 模拟上传延迟
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        const mockResponse = {
          id: Date.now(),
          name: uploadForm.value.name,
          url: URL.createObjectURL(uploadForm.value.file.raw),
          size: uploadForm.value.file.size,
          type: uploadForm.value.file.type,
          ...uploadForm.value
        }

        emit('upload-success', mockResponse)
        ElMessage.success('上传成功')
        closeDialog()
      } catch (error) {
        ElMessage.error('上传失败：' + error.message)
      } finally {
        uploading.value = false
      }
    }
  })
}

const closeDialog = () => {
  dialogVisible.value = false
}

const resetForm = () => {
  if (uploadFormRef.value) {
    uploadFormRef.value.resetFields()
  }
  uploadForm.value = {
    file: null,
    name: '',
    categoryId: null,
    tags: [],
    description: ''
  }
}
</script>

<style scoped>
.resource-upload {
  .upload-area {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
  }

  .el-upload__tip {
    color: #666;
    font-size: 12px;
    margin-top: 8px;
  }
}
</style> 