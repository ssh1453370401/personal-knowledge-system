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
    const nodes = await db.collection('knowledge-tree').find({
      userId: auth.user.userId
    }).toArray()

    // 构建知识图谱数据
    const graphData = {
      nodes: nodes.map(node => ({
        id: node._id.toString(),
        name: node.label,
        category: node.category,
        value: node.connections?.length || 0
      })),
      links: []
    }

    // 添加节点之间的关联
    nodes.forEach(node => {
      if (node.connections) {
        node.connections.forEach(conn => {
          graphData.links.push({
            source: node._id.toString(),
            target: conn.nodeId,
            value: conn.strength || 1
          })
        })
      }
    })

    return {
      statusCode: 200,
      body: JSON.stringify(graphData)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate knowledge graph' })
    }
  } finally {
    await client.close()
  }
} 