const { MongoClient } = require('mongodb')
const { authenticate } = require('./middleware/auth')

exports.handler = async (event) => {
  const auth = await authenticate(event)
  if (!auth.isAuthenticated) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    const { startTime, endTime, category, nodeId } = JSON.parse(event.body)
    await client.connect()
    const db = client.db('knowledge-system')
    
    const session = {
      userId: auth.user.userId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      duration: (new Date(endTime) - new Date(startTime)) / 1000 / 60, // 转换为分钟
      category,
      nodeId,
      createdAt: new Date()
    }

    await db.collection('study_sessions').insertOne(session)

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to track study time' })
    }
  } finally {
    await client.close()
  }
} 