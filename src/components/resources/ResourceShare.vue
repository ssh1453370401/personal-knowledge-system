<template>
  <div class="resource-share">
    <el-dialog
      v-model="dialogVisible"
      title="分享资源"
      width="400px"
    >
      <div class="share-content">
        <el-form :model="shareForm" label-width="80px">
          <el-form-item label="访问权限">
            <el-radio-group v-model="shareForm.access">
              <el-radio label="public">公开</el-radio>
              <el-radio label="private">私有</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="过期时间" v-if="shareForm.access === 'private'">
            <el-select v-model="shareForm.expireTime" style="width: 100%">
              <el-option label="1天" value="1" />
              <el-option label="7天" value="7" />
              <el-option label="30天" value="30" />
              <el-option label="永久有效" value="never" />
            </el-select>
          </el-form-item>

          <el-form-item label="分享链接">
            <div class="share-link">
              <el-input v-model="shareLink" readonly>
                <template #append>
                  <el-button @click="copyLink">复制</el-button>
                </template>
              </el-input>
            </div>
          </el-form-item>

          <el-form-item label="二维码">
            <div class="qr-code" ref="qrCodeRef"></div>
          </el-form-item>

          <el-form-item label="分享方式">
            <div class="share-methods">
              <el-button type="primary" @click="shareToWechat">
                <el-icon><Promotion /></el-icon>
                微信
              </el-button>
              <el-button type="success" @click="shareToQQ">
                <el-icon><Message /></el-icon>
                QQ
              </el-button>
              <el-button type="warning" @click="shareToWeibo">
                <el-icon><Share /></el-icon>
                微博
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Promotion, Message, Share } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'

const props = defineProps({
  visible: Boolean,
  resource: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:visible'])

const dialogVisible = ref(false)
const shareForm = ref({
  access: 'public',
  expireTime: '7'
})

const shareLink = ref('')
const qrCodeRef = ref(null)

// 监听对话框可见性
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
  if (newVal && props.resource) {
    generateShareLink()
  }
})

watch(() => dialogVisible.value, (newVal) => {
  emit('update:visible', newVal)
})

// 生成分享链接
const generateShareLink = () => {
  const baseUrl = window.location.origin
  shareLink.value = `${baseUrl}/share/${props.resource.id}`
  generateQRCode(shareLink.value)
}

// 生成二维码
const generateQRCode = async (url) => {
  try {
    const qrCodeElement = qrCodeRef.value
    if (qrCodeElement) {
      // 清除旧的二维码
      qrCodeElement.innerHTML = ''
      // 生成新的二维码
      const canvas = await QRCode.toCanvas(url, {
        width: 200,
        margin: 2
      })
      qrCodeElement.appendChild(canvas)
    }
  } catch (error) {
    console.error('QR code generation failed:', error)
  }
}

// 复制链接
const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareLink.value)
    ElMessage.success('链接已复制到剪贴板')
  } catch (err) {
    ElMessage.error('复制失败')
  }
}

// 社交分享方法
const shareToWechat = () => {
  // 实现微信分享逻辑
  ElMessage.info('微信分享功能开发中')
}

const shareToQQ = () => {
  // 实现QQ分享逻辑
  ElMessage.info('QQ分享功能开发中')
}

const shareToWeibo = () => {
  // 实现微博分享逻辑
  ElMessage.info('微博分享功能开发中')
}
</script>

<style scoped>
.share-content {
  padding: 20px 0;
}

.share-link {
  display: flex;
  align-items: center;
}

.qr-code {
  display: flex;
  justify-content: center;
  padding: 16px;
  background-color: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

.share-methods {
  display: flex;
  gap: 12px;
}
</style> 