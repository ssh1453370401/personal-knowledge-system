const { MongoClient, ObjectId } = require('mongodb')

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const client = new MongoClient(process.env.MONGODB_URI)
  
  try {
    const { id, ...updateData } = JSON.parse(event.body)
    
    await client.connect()
    const collection = client.db('knowledge-system').collection('knowledge-tree')
    
    const result = await collection.updateOne(
      { _id: ObjectId(id) },
      { $set: updateData }
    )
    
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, ...result })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to update node' })
    }
  } finally {
    await client.close()
  }
} 