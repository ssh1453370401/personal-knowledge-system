const { MongoClient } = require('mongodb')

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    await client.connect()
    const db = client.db('knowledge-system')

    // 获取各种统计数据
    const stats = {
      knowledgeTree: await db.collection('knowledge-tree').countDocuments(),
      tasks: await db.collection('tasks').countDocuments(),
      journals: await db.collection('journals').countDocuments(),
      
      // 获取最近一周的活动统计
      recentActivity: await db.collection('activity_logs')
        .find({
          timestamp: { 
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
          }
        })
        .toArray(),
      
      // 获取任务完成率
      taskCompletion: await db.collection('tasks').aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: ['$completed', 1, 0] }
            }
          }
        }
      ]).toArray()
    }

    return {
      statusCode: 200,
      body: JSON.stringify(stats)
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