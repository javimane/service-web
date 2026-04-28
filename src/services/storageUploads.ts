import { supabase } from "./supabaseClient";
import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

type UploadInput = {
  file: Blob;
  entityId?: string;
  fileName?: string;
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

function buildObjectPath(config: StorageConfig) {
  return `${config.path}/${config.uuid}.webp`;
}

async function uploadFile(configEndpoint: string, input: UploadInput) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Debes iniciar sesión para subir archivos.");
  }

  const config = await apiClient<StorageConfig>(configEndpoint, { method: "GET" });

  const bucket = config.bucket;
  const path = buildObjectPath(config);

  const { error } = await supabase.storage.from(bucket).upload(path, input.file, {
    contentType: input.contentType || input.file.type || undefined,
    upsert: true,
  });

  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  return {
    bucket,
    path,
    publicUrl: data.publicUrl,
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
