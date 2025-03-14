const { createPresignedPost } = require('@aws-sdk/s3-presigned-post')
const { S3Client } = require('@aws-sdk/client-s3')

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  region: process.env.AWS_REGION,
})

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  try {
    const { filename, contentType } = JSON.parse(event.body)
    const Key = `uploads/${Date.now()}-${filename}`

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.AWS_S3_BUCKET,
      Key,
      Conditions: [
        ['content-length-range', 0, 10485760], // up to 10MB
        ['starts-with', '$Content-Type', contentType],
      ],
      Expires: 300,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({ url, fields }),
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate upload URL' }),
    }
  }
} 