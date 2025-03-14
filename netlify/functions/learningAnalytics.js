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

    // 获取学习进度统计
    const learningStats = await db.collection('knowledge-tree').aggregate([
      { $match: { userId: auth.user.userId } },
      {
        $group: {
          _id: '$category',
          totalNodes: { $sum: 1 },
          completedNodes: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          inProgressNodes: {
            $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] }
          }
        }
      }
    ]).toArray()

    // 获取学习时间统计
    const timeStats = await db.collection('study_sessions').aggregate([
      { $match: { userId: auth.user.userId } },
      {
        $group: {
          _id: {
            year: { $year: '$startTime' },
            month: { $month: '$startTime' },
            day: { $dayOfMonth: '$startTime' }
          },
          totalDuration: { $sum: '$duration' }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
      { $limit: 30 }
    ]).toArray()

    return {
      statusCode: 200,
      body: JSON.stringify({
        learningStats,
        timeStats
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Analytics failed' })
    }
  } finally {
    await client.close()
  }
} 