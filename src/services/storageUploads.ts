import { supabase } from "./supabaseClient";
import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";
import { multimediaService } from "./multimediaService";

type UploadInput = {
  file: Blob;
  entityId?: string;
  fileName?: string;
  contentType?: string;
};

type UploadResult = {
  publicUrl: string;
};

interface StorageConfig {
  bucket: string;
  path: string;
  signedUrl: string;
  publicUrlData: {
    publicUrl: string;
  };
}

async function uploadFile(configEndpoint: string, input: UploadInput) {
  const config = await apiClient<StorageConfig>(configEndpoint, {
    method: "GET",
  });

  const bucket = config.bucket;

  await uploadToPresignedUrl(config.signedUrl, input.file);

  return {
    publicUrl: config.publicUrlData.publicUrl,
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

async function uploadToPresignedUrl(uploadUrl: string, file: Blob) {
  const headers = file.type ? { "Content-Type": file.type } : undefined;

  let response: Response;
  try {
    response = await fetch(uploadUrl, {
      method: "PUT",
      headers,
      body: file,
    });
  } catch {
    throw new Error(
      "No se pudo iniciar la subida del archivo. Verifica CORS del bucket, URL prefirmada vigente y conectividad.",
    );
  }

  if (!response.ok) {
    throw new Error("No se pudo subir el archivo al bucket de AWS.");
  }
}
