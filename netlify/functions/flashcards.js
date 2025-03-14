const { MongoClient } = require('mongodb')
const { authenticate } = require('./middleware/auth')

exports.handler = async (event) => {
  const auth = await authenticate(event)
  if (!auth.isAuthenticated) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('knowledge-system')
    const collection = db.collection('flashcards')

    switch (event.httpMethod) {
      case 'GET':
        const { category } = event.queryStringParameters || {}
        const query = { userId: auth.user.userId }
        if (category) query.category = category

        // 使用 SRS (Spaced Repetition System) 算法选择需要复习的卡片
        const cards = await collection.find({
          ...query,
          nextReview: { $lte: new Date() }
        })
        .sort({ nextReview: 1 })
        .limit(20)
        .toArray()

        return { 
          statusCode: 200, 
          body: JSON.stringify(cards) 
        }

      case 'POST':
        const { front, back, category, nodeId } = JSON.parse(event.body)
        const newCard = {
          userId: auth.user.userId,
          front,
          back,
          category,
          nodeId,
          level: 0,
          nextReview: new Date(),
          createdAt: new Date()
        }
        await collection.insertOne(newCard)
        return { 
          statusCode: 201, 
          body: JSON.stringify(newCard) 
        }

      case 'PUT':
        const { cardId, result } = JSON.parse(event.body)
        // 根据复习结果更新间隔
        const interval = calculateNextInterval(result)
        await collection.updateOne(
          { _id: cardId },
          { 
            $inc: { level: result === 'good' ? 1 : -1 },
            $set: { 
              nextReview: new Date(Date.now() + interval),
              lastReviewed: new Date()
            }
          }
        )
        return { 
          statusCode: 200, 
          body: JSON.stringify({ success: true }) 
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

function calculateNextInterval(result) {
  // 简单的 SRS 间隔计算
  const intervals = {
    again: 1000 * 60 * 60, // 1小时
    hard: 1000 * 60 * 60 * 24, // 1天
    good: 1000 * 60 * 60 * 24 * 3, // 3天
    easy: 1000 * 60 * 60 * 24 * 7 // 1周
  }
  return intervals[result]
} 