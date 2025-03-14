import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/learning-path',
    name: 'LearningPath',
    component: () => import('../views/LearningPath.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/mind-map',
    name: 'MindMap',
    component: () => import('../views/MindMap.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/goals',
    name: 'Goals',
    component: () => import('../views/Goals.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/notes',
    name: 'Notes',
    component: () => import('../views/Notes.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/resources',
    name: 'Resources',
    component: () => import('../views/Resources.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/stats',
    name: 'Stats',
    component: () => import('../views/Stats.vue'),
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/assistant',
    name: 'Assistant',
    component: () => import('../views/Assistant.vue'),
    meta: {
      requiresAuth: true
    }
  },
  // ... 其他路由配置
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth !== false)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})

export default router 