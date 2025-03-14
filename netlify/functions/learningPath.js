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
    const collection = db.collection('learningPaths')

    switch (event.httpMethod) {
      case 'GET':
        const { pathId } = event.queryStringParameters || {}
        if (pathId) {
          const path = await collection.findOne({
            _id: pathId,
            userId: auth.user.userId
          })
          return { statusCode: 200, body: JSON.stringify(path) }
        } else {
          const paths = await collection.find({
            userId: auth.user.userId
          }).toArray()
          return { statusCode: 200, body: JSON.stringify(paths) }
        }

      case 'POST':
        const newPath = JSON.parse(event.body)
        newPath.userId = auth.user.userId
        newPath.createdAt = new Date()
        newPath.progress = 0
        
        const result = await collection.insertOne(newPath)
        return { 
          statusCode: 201, 
          body: JSON.stringify({ ...newPath, _id: result.insertedId }) 
        }

      case 'PUT':
        const { pathId: updatePathId, ...updates } = JSON.parse(event.body)
        await collection.updateOne(
          { _id: updatePathId, userId: auth.user.userId },
          { $set: updates }
        )
        return { statusCode: 200, body: JSON.stringify({ success: true }) }

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