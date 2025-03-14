const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI
const dbName = 'knowledge-system'

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const client = new MongoClient(uri)
  
  try {
    const { email, password } = JSON.parse(event.body)
    
    await client.connect()
    const db = client.db(dbName)
    const users = db.collection('users')
    
    const user = await users.findOne({ email })
    
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }
    
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )
    
    return {
      statusCode: 200,
      body: JSON.stringify({ token, user: { email: user.email, name: user.name } })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  } finally {
    await client.close()
  }
} 