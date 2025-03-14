const { MongoClient } = require('mongodb')
const { Parser } = require('json2csv')

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const client = new MongoClient(process.env.MONGODB_URI)

  try {
    const { type, format } = JSON.parse(event.body)
    await client.connect()
    const db = client.db('knowledge-system')
    const collection = db.collection(type)

    const data = await collection.find({}).toArray()

    if (format === 'csv') {
      const parser = new Parser()
      const csv = parser.parse(data)
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=${type}-export.csv`
        },
        body: csv
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename=${type}-export.json`
      },
      body: JSON.stringify(data, null, 2)
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Export failed' })
    }
  } finally {
    await client.close()
  }
} 