const { MongoClient } = require('mongodb')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    const { query, types } = JSON.parse(event.body)
    await client.connect()
    const db = client.db('knowledge-system')

    const searchPromises = types.map(async (type) => {
      const collection = db.collection(type)
      return collection.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" } }).limit(10).toArray()
    })

    const results = await Promise.all(searchPromises)
    const flatResults = results.flat()

    return {
      statusCode: 200,
      body: JSON.stringify(flatResults)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Search failed' })
    }
  } finally {
    await client.close()
  }
} 