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
    const collection = db.collection('tags')

    switch (event.httpMethod) {
      case 'GET':
        const tags = await collection.find({
          userId: auth.user.userId
        }).toArray()
        return { statusCode: 200, body: JSON.stringify(tags) }

      case 'POST':
        const { name, color, category } = JSON.parse(event.body)
        const newTag = {
          userId: auth.user.userId,
          name,
          color,
          category,
          createdAt: new Date()
        }
        await collection.insertOne(newTag)
        return { statusCode: 201, body: JSON.stringify(newTag) }

      default:
        return { statusCode: 405, body: 'Method Not Allowed' }
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Operation failed' }) }
  } finally {
    await client.close()
  }
} 