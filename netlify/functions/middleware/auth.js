const jwt = require('jsonwebtoken')

exports.authenticate = async (event) => {
  const token = event.headers.authorization?.split(' ')[1]
  
  if (!token) {
    return {
      isAuthenticated: false,
      error: 'No token provided'
    }
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    return {
      isAuthenticated: true,
      user: decoded
    }
  } catch (error) {
    return {
      isAuthenticated: false,
      error: 'Invalid token'
    }
  }
} 