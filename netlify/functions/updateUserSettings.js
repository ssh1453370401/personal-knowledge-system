const { MongoClient, ObjectId } = require('mongodb')
const { authenticate } = require('./middleware/auth')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const auth = await authenticate(event)
  if (!auth.isAuthenticated) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    const settings = JSON.parse(event.body)
    await client.connect()
    const db = client.db('knowledge-system')
    
    await db.collection('users').updateOne(
      { _id: ObjectId(auth.user.userId) },
      { $set: { settings } }
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update settings' })
    }
  } finally {
    await client.close()
  }
} 