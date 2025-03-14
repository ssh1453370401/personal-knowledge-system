const API_BASE_URL = import.meta.env.PROD 
  ? '/.netlify/functions'
  : 'http://localhost:8888/.netlify/functions'

export async function fetchKnowledgeTree() {
  try {
    const response = await fetch(`${API_BASE_URL}/getKnowledgeTree`)
    if (!response.ok) throw new Error('Network response was not ok')
    return await response.json()
  } catch (error) {
    console.error('Error fetching knowledge tree:', error)
    throw error
  }
} 