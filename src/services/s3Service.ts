import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";

const REGION = import.meta.env.VITE_AWS_REGION || "us-east-1";
const BUCKET = import.meta.env.VITE_AWS_BUCKET_NAME;
const ACCESS_KEY = import.meta.env.VITE_AWS_ACCESS_KEY_ID;
const SECRET_KEY = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY;

// Check if S3 is configured
const isS3Configured = !!(ACCESS_KEY && SECRET_KEY && BUCKET);

let s3Client: S3Client | null = null;

if (isS3Configured) {
  s3Client = new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY || "",
      secretAccessKey: SECRET_KEY || "",
    },
  });
}

// Fetch a single object (Granular Mode)
export const fetchItem = async <T>(key: string): Promise<T | null> => {
  if (!isS3Configured || !s3Client) {
    // Fallback/Mock for local dev without S3
    const localData = localStorage.getItem(`cache_${key}`);
    return localData ? JSON.parse(localData) : null;
  }

  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    const response = await s3Client.send(command);
    const bodyContents = await response.Body?.transformToString();
    return bodyContents ? JSON.parse(bodyContents) : null;
  } catch (error: any) {
    if (error.name === "NoSuchKey") {
      return null;
    }
    console.error(`Error fetching item ${key} from S3:`, error);
    return null;
  }
};

// Save a single object (Granular Mode)
export const saveItem = async <T>(key: string, data: T): Promise<void> => {
  // Update localStorage for cache/fallback
  localStorage.setItem(`cache_${key}`, JSON.stringify(data));

  if (!isS3Configured || !s3Client) {
    console.log(`Mocking S3 save for ${key} (Local only)`);
    return;
  }

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: JSON.stringify(data, null, 2),
      ContentType: "application/json",
    });
    await s3Client.send(command);
  } catch (error) {
    console.error(`Error saving ${key} to S3:`, error);
    throw error;
  }
};

// List keys with a prefix (e.g., "applications/")
export const listKeys = async (prefix: string): Promise<string[]> => {
  if (!isS3Configured || !s3Client) {
    // Mock listing from localStorage keys
    return Object.keys(localStorage).filter(k => k.startsWith(`cache_${prefix}`)).map(k => k.replace('cache_', ''));
  }

  try {
    let keys: string[] = [];
    let continuationToken: string | undefined = undefined;

    do {
      const command: ListObjectsV2Command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });
      const response = await s3Client.send(command);
      if (response.Contents) {
        response.Contents.forEach((item) => {
          if (item.Key) keys.push(item.Key);
        });
      }
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  } catch (error) {
    console.error(`Error listing keys for prefix ${prefix}:`, error);
    return [];
  }
};

// Delete a file
export const deleteFile = async (key: string): Promise<void> => {
  localStorage.removeItem(`cache_${key}`);

  if (!isS3Configured || !s3Client) {
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
    throw error;
  }
};

// Legacy support (optional, can be removed if not used anymore)
export const fetchJSON = async <T>(key: string): Promise<T[]> => {
  const result = await fetchItem<T[]>(key);
  return result || [];
};

export const saveJSON = async <T>(key: string, data: T[]): Promise<void> => {
  await saveItem(key, data);
};
