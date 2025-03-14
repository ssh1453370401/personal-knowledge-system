<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <h2>登录</h2>
      </template>
      
      <el-form
        ref="loginForm"
        :model="loginData"
        :rules="rules"
        label-position="top"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="loginData.email"
            type="email"
            placeholder="请输入邮箱"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginData.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            :loading="authStore.loading"
            @click="handleLogin"
            block
          >
            登录
          </el-button>
        </el-form-item>
      </el-form>
      
      <div v-if="authStore.error" class="error-message">
        {{ authStore.error }}
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const router = useRouter()
const authStore = useAuthStore()
const loginForm = ref(null)

const loginData = reactive({
  email: '',
  password: ''
})

const rules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginForm.value) return
  
  try {
    await loginForm.value.validate()
    await authStore.login(loginData)
    router.push('/')
  } catch (error) {
    console.error('Login failed:', error)
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--bg-color-light);
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.error-message {
  color: var(--el-color-danger);
  text-align: center;
  margin-top: 16px;
}
</style> 