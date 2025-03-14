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
    const sharingCollection = db.collection('sharing')

    switch (event.httpMethod) {
      case 'POST':
        const { contentId, email, permissions } = JSON.parse(event.body)
        const sharing = {
          contentId,
          ownerUserId: auth.user.userId,
          sharedWithEmail: email,
          permissions,
          createdAt: new Date()
        }
        await sharingCollection.insertOne(sharing)
        return { statusCode: 201, body: JSON.stringify(sharing) }

      case 'GET':
        const { id } = event.queryStringParameters
        const shares = await sharingCollection
          .find({ contentId: id })
          .toArray()
        return { statusCode: 200, body: JSON.stringify(shares) }

      default:
        return { statusCode: 405, body: 'Method Not Allowed' }
    }
  } catch (error) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Operation failed' }) }
  } finally {
    await client.close()
  }
} 