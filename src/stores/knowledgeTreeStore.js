import { defineStore } from 'pinia'
import { knowledgeTreeApi } from '../services/api'

export const useKnowledgeTreeStore = defineStore('knowledgeTree', {
  state: () => ({
    nodes: [],
    selectedNodeId: null,
    loading: false,
    error: null
  }),

  actions: {
    async fetchNodes() {
      this.loading = true
      try {
        const { data } = await knowledgeTreeApi.getAll()
        this.nodes = data
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    },

    async updateNode(nodeData) {
      try {
        await knowledgeTreeApi.updateNode(nodeData)
        // 更新本地状态
        const index = this.nodes.findIndex(n => n.id === nodeData.id)
        if (index !== -1) {
          this.nodes[index] = { ...this.nodes[index], ...nodeData }
        }
      } catch (error) {
        this.error = error.message
        throw error
      }
    }
    // ... 其他方法
  }
}) 