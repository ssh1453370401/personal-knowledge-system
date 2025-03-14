const { Configuration, OpenAIApi } = require('openai')
const { authenticate } = require('./middleware/auth')

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

exports.handler = async (event) => {
  const auth = await authenticate(event)
  if (!auth.isAuthenticated) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const { prompt, type } = JSON.parse(event.body)
    
    let systemPrompt = ''
    switch (type) {
      case 'summarize':
        systemPrompt = '请总结以下内容的要点：'
        break
      case 'expand':
        systemPrompt = '请基于以下内容进行扩展和补充：'
        break
      case 'improve':
        systemPrompt = '请优化以下内容的表达：'
        break
      default:
        systemPrompt = '请针对以下内容提供建议：'
    }

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        content: completion.data.choices[0].message.content
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AI processing failed' })
    }
  }
} 