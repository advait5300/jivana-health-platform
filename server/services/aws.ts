import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Mock implementation for development
const mockStorage = new Map<string, Buffer>();

/**
 * Uploads a file to storage (S3 in production, memory in development)
 */
export async function uploadFile(key: string, file: Buffer): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials not configured");
    }

    const s3 = new S3Client({ region: "us-east-1" });
    const command = new PutObjectCommand({
      Bucket: "jivana-blood-tests",
      Key: key,
      Body: file,
    });

    await s3.send(command);
  } else {
    // In development, store in memory
    mockStorage.set(key, file);
  }
}

/**
 * Gets a file URL (signed S3 URL in production, mock URL in development)
 */
export async function getFileUrl(key: string): Promise<string> {
  if (process.env.NODE_ENV === "production") {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error("AWS credentials not configured");
    }

    const s3 = new S3Client({ region: "us-east-1" });
    const command = new GetObjectCommand({
      Bucket: "jivana-blood-tests",
      Key: key,
    });

    return getSignedUrl(s3, command, { expiresIn: 3600 });
  } else {
    // In development, return a mock URL
    return `mock-url://${key}`;
  }
}