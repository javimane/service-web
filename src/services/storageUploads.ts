import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { supabase } from "./supabaseClient";

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

const DEFAULT_BUCKETS: Record<UploadCategory, string> = {
  proposalPdf: "proposal-pdfs",
  promotionImage: "promotion-images",
  profileImage: "profile-images",
  workImage: "profile-work-images",
  productImage: "product-images",
};

function getProjectRef() {
  const configuredProjectRef = import.meta.env.VITE_SUPABASE_PROJECT_REF;

  if (configuredProjectRef) return configuredProjectRef;

  const hostname = new URL(import.meta.env.VITE_SUPABASE_URL).hostname;
  return hostname.split(".")[0] ?? "";
}

function getS3Endpoint(projectRef: string) {
  return (
    import.meta.env.VITE_SUPABASE_STORAGE_S3_ENDPOINT ||
    `https://${projectRef}.storage.supabase.co/storage/v1/s3`
  );
}

function getBucket(category: UploadCategory) {
  const envBuckets: Partial<Record<UploadCategory, string>> = {
    proposalPdf: import.meta.env.VITE_SUPABASE_BUCKET_PROPOSAL_PDFS,
    promotionImage: import.meta.env.VITE_SUPABASE_BUCKET_PROMOTION_IMAGES,
    profileImage: import.meta.env.VITE_SUPABASE_BUCKET_PROFILE_IMAGES,
    workImage: import.meta.env.VITE_SUPABASE_BUCKET_PROFILE_WORK_IMAGES,
    productImage: import.meta.env.VITE_SUPABASE_BUCKET_PRODUCT_IMAGES,
  };

  return envBuckets[category] || DEFAULT_BUCKETS[category];
}

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

function buildObjectPath(category: UploadCategory, input: UploadInput) {
  const folder = input.folder ? `${sanitizePathSegment(input.folder)}/` : "";
  const entityId = input.entityId ? `${sanitizePathSegment(input.entityId)}/` : "";
  const extension = getFileExtension(input.file, input.fileName);
  const baseName = input.fileName
    ? input.fileName.replace(/\.[^.]+$/, "")
    : `${category}-${Date.now()}`;

  return `${folder}${entityId}${sanitizePathSegment(baseName)}.${extension}`;
}

async function createStorageClient() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("No hay una sesión activa para subir archivos.");
  }

  const projectRef = getProjectRef();

  if (!projectRef) {
    throw new Error("No se pudo resolver el project ref de Supabase.");
  }

  return new S3Client({
    forcePathStyle: true,
    region: import.meta.env.VITE_SUPABASE_PROJECT_REGION || "us-east-1",
    endpoint: getS3Endpoint(projectRef),
    credentials: {
      accessKeyId: projectRef,
      secretAccessKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      sessionToken: session.access_token,
    },
  });
}

async function uploadFile(category: UploadCategory, input: UploadInput) {
  const client = await createStorageClient();
  const bucket = getBucket(category);
  const path = buildObjectPath(category, input);

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
  return uploadFile("proposalPdf", input);
}

export async function uploadPromotionImage(input: UploadInput) {
  return uploadFile("promotionImage", input);
}

export async function uploadProfileImage(input: UploadInput) {
  return uploadFile("profileImage", input);
}

export async function uploadProfileWorkImage(input: UploadInput) {
  return uploadFile("workImage", input);
}

export async function uploadProductImage(input: UploadInput) {
  return uploadFile("productImage", input);
}
