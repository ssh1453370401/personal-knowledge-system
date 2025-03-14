const { MongoClient, ObjectId } = require('mongodb')
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
    const versionsCollection = db.collection('versions')

    switch (event.httpMethod) {
      case 'POST':
        const { contentId, content, type } = JSON.parse(event.body)
        const version = {
          contentId,
          content,
          type,
          userId: auth.user.userId,
          createdAt: new Date()
        }
        await versionsCollection.insertOne(version)
        return { statusCode: 201, body: JSON.stringify(version) }

      case 'GET':
        const { id } = event.queryStringParameters
        const versions = await versionsCollection
          .find({ contentId: id })
          .sort({ createdAt: -1 })
          .toArray()
        return { statusCode: 200, body: JSON.stringify(versions) }

      default:
        return { statusCode: 405, body: 'Method Not Allowed' }
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Operation failed' }) }
  } finally {
    await client.close()
  }
} 