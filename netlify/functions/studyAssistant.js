const { MongoClient } = require('mongodb')
const { authenticate } = require('./middleware/auth')
const OpenAI = require('openai')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

exports.handler = async (event) => {
  const auth = await authenticate(event)
  if (!auth.isAuthenticated) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('knowledge-system')
    
    switch (event.httpMethod) {
      case 'POST':
        const { type, content, nodeId } = JSON.parse(event.body)
        
        switch (type) {
          case 'generate_quiz':
            // 根据知识点内容生成测试题
            const quizPrompt = `根据以下知识点内容生成3道测试题（包含答案和解析）：\n\n${content}`
            const quizResponse = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: quizPrompt }],
              temperature: 0.7
            })
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                quiz: quizResponse.choices[0].message.content
              })
            }

          case 'explain_concept':
            // 解释概念并提供示例
            const explainPrompt = `请详细解释以下概念，并提供具体示例：\n\n${content}`
            const explainResponse = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: explainPrompt }],
              temperature: 0.7
            })
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                explanation: explainResponse.choices[0].message.content
              })
            }

          case 'generate_summary':
            // 生成知识点总结
            const summaryPrompt = `请对以下内容进行简洁的总结，并列出关键要点：\n\n${content}`
            const summaryResponse = await openai.chat.completions.create({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: summaryPrompt }],
              temperature: 0.7
            })
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                summary: summaryResponse.choices[0].message.content
              })
            }

          default:
            return { 
              statusCode: 400, 
              body: JSON.stringify({ error: 'Invalid operation type' }) 
            }
        }

      default:
        return { statusCode: 405, body: 'Method Not Allowed' }
    }
  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Operation failed' }) 
    }
  } finally {
    await client.close()
  }
} 