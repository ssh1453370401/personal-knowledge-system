const connectToDatabase = require('./utils/mongodb')

exports.handler = async (event, context) => {
  try {
    // 启用 lambda 函数的连接复用
    context.callbackWaitsForEmptyEventLoop = false

    // 连接数据库
    const db = await connectToDatabase()
    
    // 获取知识树数据
    const nodes = await db.collection('knowledgeNodes').find({}).toArray()

    return {
      statusCode: 200,
      body: JSON.stringify(nodes)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database connection failed' })
    }
  }
} 