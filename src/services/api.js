import axios from 'axios'

const api = axios.create({
  baseURL: '/api'
})

// 请求拦截器
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 清除本地存储的认证信息
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // 重定向到登录页
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (credentials) => api.post('/auth', credentials),
  register: (userData) => api.post('/register', userData)
}

export const knowledgeTreeApi = {
  getAll: () => api.get('/getKnowledgeTree'),
  updateNode: (nodeData) => api.post('/updateKnowledgeNode', nodeData),
  deleteNode: (nodeId) => api.delete(`/deleteKnowledgeNode/${nodeId}`),
  createNode: (nodeData) => api.post('/createKnowledgeNode', nodeData)
}

export const scheduleApi = {
  getTasks: () => api.get('/getTasks'),
  createTask: (taskData) => api.post('/createTask', taskData),
  updateTask: (taskData) => api.put(`/updateTask/${taskData.id}`, taskData),
  deleteTask: (taskId) => api.delete(`/deleteTask/${taskId}`)
}

export const journalApi = {
  getEntries: () => api.get('/getJournalEntries'),
  createEntry: (entryData) => api.post('/createJournalEntry', entryData),
  updateEntry: (entryData) => api.put(`/updateJournalEntry/${entryData.id}`, entryData),
  deleteEntry: (entryId) => api.delete(`/deleteJournalEntry/${entryId}`)
} 