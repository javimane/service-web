import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { supabase } from "./supabaseClient";
import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

type UploadCategory =
  | "proposalPdf"
  | "promotionImage"
  | "profileImage"
  | "workImage"
  | "productImage";

type UploadInput = {
  file: Blob;
  entityId?: string;
  fileName?: string;
  folder?: string;
  contentType?: string;
};

type UploadResult = {
  bucket: string;
  path: string;
  publicUrl: string;
};

interface StorageConfig {
  bucket: string;
  path: string;
  uuid: string;
}

function getProjectRef() {
  const configuredProjectRef = import.meta.env.VITE_SUPABASE_STORAGE_S3_KEY;

  if (configuredProjectRef) return configuredProjectRef;

  const hostname = new URL(import.meta.env.VITE_SUPABASE_STORAGE_ENDPOINT).hostname;
  return hostname.split(".")[0] ?? "";
}

// Dynamic bucket resolution is now handled via API endpoints in each upload function

function sanitizePathSegment(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
}

function getFileExtension(file: Blob, fileName?: string) {
  if (fileName?.includes(".")) {
    return fileName.split(".").pop() ?? "bin";
  }

  const mimeMap: Record<string, string> = {
    "application/pdf": "pdf",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return mimeMap[file.type] || "bin";
}

function buildObjectPath(config: StorageConfig, input: UploadInput) {
  const extension = getFileExtension(input.file, input.fileName);
  
  if (input.fileName) {
    const baseName = input.fileName.replace(/\.[^.]+$/, "");
    return `${config.path}/${config.uuid}-${sanitizePathSegment(baseName)}.${extension}`;
  }

  return `${config.path}/${config.uuid}.${extension}`;
}

async function createStorageClient() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No hay una sesión activa para subir archivos.");
  }

  return new S3Client({
    forcePathStyle: true,
    region: "us-east-1",
    endpoint: import.meta.env.VITE_SUPABASE_STORAGE_S3_ENDPOINT,
    credentials: {
      accessKeyId: import.meta.env.VITE_SUPABASE_STORAGE_S3_KEY,
      secretAccessKey: import.meta.env.VITE_SUPABASE_STORAGE_S3_SECRET_KEY,
      sessionToken: session.access_token,
    },
  });
}

async function uploadFile(configEndpoint: string, input: UploadInput) {
  const config = await apiClient<StorageConfig>(configEndpoint, { method: "GET" });
  const client = await createStorageClient();
  const bucket = config.bucket;
  const path = buildObjectPath(config, input);

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: path,
      Body: input.file,
      ContentType: input.contentType || input.file.type || undefined,
    }),
  );

  const {
    data: { publicUrl },
  } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    publicUrl,
  } satisfies UploadResult;
}

export async function uploadProposalPdf(input: UploadInput) {
  // Assuming a default or similar mechanism for PDFs if no endpoint yet
  return uploadFile(API_ENDPOINTS.storage.products, input); 
}

export async function uploadPromotionImage(input: UploadInput) {
  return uploadFile(API_ENDPOINTS.storage.promotions, input);
}

export async function uploadProfileImage(input: UploadInput) {
  return uploadFile(API_ENDPOINTS.storage.profile, input);
}

export async function uploadProfileWorkImage(input: UploadInput) {
  return uploadFile(API_ENDPOINTS.storage.portfolio, input);
}

export async function uploadProductImage(input: UploadInput) {
  return uploadFile(API_ENDPOINTS.storage.products, input);
}
