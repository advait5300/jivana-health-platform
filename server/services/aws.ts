import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Initialize S3 client for file storage
 * Uses AWS credentials from environment variables
 */
const s3 = new S3Client({
  region: "us-east-1",
});

// S3 bucket name for storing blood test files
const BUCKET_NAME = "jivana-blood-tests";

/**
 * Uploads a file to S3
 * @param {string} key - Unique identifier for the file, typically includes user ID and filename
 * @param {Buffer} file - File buffer to upload
 * @throws {Error} If upload fails
 * 
 * @example
 * const fileKey = `${userId}/${nanoid()}-bloodtest.pdf`;
 * await uploadFile(fileKey, fileBuffer);
 */
export async function uploadFile(key: string, file: Buffer): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: file,
  });

  await s3.send(command);
}

/**
 * Generates a pre-signed URL for secure file access
 * URL expires after 1 hour
 * 
 * @param {string} key - S3 object key to generate URL for
 * @returns {Promise<string>} Pre-signed URL for file access
 * @throws {Error} If URL generation fails
 * 
 * @example
 * const url = await getFileUrl('user123/test-123.pdf');
 * // url can be used to download the file for the next hour
 */
export async function getFileUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: 3600 });
}