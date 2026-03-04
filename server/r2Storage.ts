import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || "";
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export class R2StorageService {
  isConfigured(): boolean {
    return !!(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME && R2_PUBLIC_URL);
  }

  getPublicUrl(key: string): string {
    const baseUrl = R2_PUBLIC_URL.replace(/\/$/, "");
    return `${baseUrl}/${key}`;
  }

  async getSignedUploadUrl(
    fileName: string,
    contentType: string,
    folder: string = "restaurants"
  ): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    const ext = fileName.split(".").pop() || "jpg";
    const uniqueName = `${randomUUID()}.${ext}`;
    const key = `${folder}/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = this.getPublicUrl(key);

    return { uploadUrl, publicUrl, key };
  }

  async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    contentType: string,
    folder: string = "restaurants"
  ): Promise<{ publicUrl: string; key: string }> {
    const ext = fileName.split(".").pop() || "jpg";
    const uniqueName = `${randomUUID()}.${ext}`;
    const key = `${folder}/${uniqueName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    const publicUrl = this.getPublicUrl(key);

    return { publicUrl, key };
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
  }

  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      });
      await s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url || !R2_PUBLIC_URL) return null;
    const baseUrl = R2_PUBLIC_URL.replace(/\/$/, "");
    if (url.startsWith(baseUrl + "/")) {
      return url.substring(baseUrl.length + 1);
    }
    return null;
  }

  async deleteByUrl(url: string): Promise<boolean> {
    const key = this.extractKeyFromUrl(url);
    if (!key) return false;
    try {
      await this.deleteFile(key);
      return true;
    } catch (err) {
      console.error(`Failed to delete R2 file ${key}:`, err);
      return false;
    }
  }
}

export const r2Storage = new R2StorageService();
