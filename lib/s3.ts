import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

function getAwsConfig() {
  const region = process.env.AWS_REGION || 'us-east-1'
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || ''
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_KEY || ''
  const bucket = process.env.S3_BUCKET_NAME || ''
  return { region, accessKeyId, secretAccessKey, bucket }
}

function getS3Client(): { client: S3Client | null; error?: string } {
  const { region, accessKeyId, secretAccessKey } = getAwsConfig()
  if (!accessKeyId || !secretAccessKey) {
    return { client: null, error: 'Missing AWS credentials' }
  }
  const client = new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  })
  return { client }
}

export async function uploadToS3(file: Buffer, key: string, contentType: string) {
  const { client, error } = getS3Client()
  const { bucket, region } = getAwsConfig()
  if (error) return { success: false as const, error }
  if (!bucket) return { success: false as const, error: 'Missing S3 bucket name' }

  const command = new PutObjectCommand({ Bucket: bucket, Key: key, Body: file, ContentType: contentType })

  try {
    const result = await client!.send(command)
    return { success: true as const, key, etag: result.ETag, location: `https://${bucket}.s3.${region}.amazonaws.com/${key}` }
  } catch (err) {
    console.error('S3 upload error:', err)
    return { success: false as const, error: err instanceof Error ? err.message : 'Upload failed' }
  }
}

export async function getSignedDownloadUrl(key: string, expiresIn: number = 3600) {
  const { client, error } = getS3Client()
  const { bucket } = getAwsConfig()
  if (error) return { success: false as const, error }
  if (!bucket) return { success: false as const, error: 'Missing S3 bucket name' }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key })

  try {
    const url = await getSignedUrl(client!, command, { expiresIn })
    return { success: true as const, url }
  } catch (err) {
    console.error('S3 signed URL error:', err)
    return { success: false as const, error: err instanceof Error ? err.message : 'Failed to generate URL' }
  }
}

export async function deleteFromS3(key: string) {
  const { client, error } = getS3Client()
  const { bucket } = getAwsConfig()
  if (error) return { success: false as const, error }
  if (!bucket) return { success: false as const, error: 'Missing S3 bucket name' }

  const command = new DeleteObjectCommand({ Bucket: bucket, Key: key })

  try {
    await client!.send(command)
    return { success: true as const }
  } catch (err) {
    console.error('S3 delete error:', err)
    return { success: false as const, error: err instanceof Error ? err.message : 'Delete failed' }
  }
}

export function generateFileKey(userId: string, originalName: string, type: 'document' | 'voice' | 'image' = 'document'): string {
  const timestamp = Date.now()
  const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${type}/${userId}/${timestamp}_${sanitizedName}`
}
