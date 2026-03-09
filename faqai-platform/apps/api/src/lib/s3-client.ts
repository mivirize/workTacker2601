import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger.js';

const BUCKET = process.env['S3_BUCKET'] ?? 'faqai-screenshots';

let cachedClient: S3Client | null = null;

export function getS3Client(): S3Client {
  if (cachedClient) return cachedClient;

  const accessKeyId = process.env['S3_ACCESS_KEY'] ?? process.env['MINIO_ACCESS_KEY'];
  const secretAccessKey = process.env['S3_SECRET_KEY'] ?? process.env['MINIO_SECRET_KEY'];

  if (!accessKeyId || !secretAccessKey) {
    throw new Error(
      'S3 credentials required: Set S3_ACCESS_KEY/S3_SECRET_KEY or MINIO_ACCESS_KEY/MINIO_SECRET_KEY',
    );
  }

  const minioEndpoint = process.env['MINIO_ENDPOINT']
    ? `http${process.env['MINIO_USE_SSL'] === 'true' ? 's' : ''}://${process.env['MINIO_ENDPOINT']}:${process.env['MINIO_PORT'] ?? '9000'}`
    : undefined;

  cachedClient = new S3Client({
    endpoint: process.env['S3_ENDPOINT'] ?? minioEndpoint ?? 'http://localhost:9000',
    region: 'us-east-1',
    credentials: { accessKeyId, secretAccessKey },
    forcePathStyle: true, // MinIO compatibility
  });

  return cachedClient;
}

export async function uploadScreenshot(
  key: string,
  buffer: Buffer,
  contentType = 'image/png',
): Promise<{ storagePath: string; fileSizeBytes: number }> {
  const client = getS3Client();
  await client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));
  return { storagePath: `${BUCKET}/${key}`, fileSizeBytes: buffer.length };
}

export async function getScreenshotUrl(storagePath: string): Promise<string> {
  const [bucket, ...keyParts] = storagePath.split('/');
  const key = keyParts.join('/');

  if (!bucket || !key) {
    throw new Error(`Invalid storagePath format: "${storagePath}"`);
  }

  const client = getS3Client();
  try {
    return await getSignedUrl(client, new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }), { expiresIn: 3600 });
  } catch (err) {
    logger.error({ storagePath, err: String(err) }, 'Failed to generate presigned URL');
    throw new Error(`Failed to generate presigned URL for ${storagePath}`);
  }
}
