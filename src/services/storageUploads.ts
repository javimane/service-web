import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

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
  publicUrl: string;
}

async function convertToWebP(file: Blob, quality: number = 0.8): Promise<Blob> {
  if (
    typeof window === "undefined" ||
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/webp"
  ) {
    return file;
  }

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(file);

      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const fileName = (file as File).name
              ? (file as File).name.replace(/\.[^/.]+$/, "") + ".webp"
              : "image.webp";
            const webpFile = new File([blob], fileName, { type: "image/webp" });
            resolve(webpFile);
          } else {
            resolve(file);
          }
        },
        "image/webp",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

async function uploadFile(configEndpoint: string, input: UploadInput) {
  const optimizedFile = await convertToWebP(input.file);

  const config = await apiClient<StorageConfig>(configEndpoint, {
    method: "GET",
  });

  await uploadToPresignedUrl(config.signedUrl, optimizedFile);

  return {
    publicUrl: config.publicUrl,
  } satisfies UploadResult;
}

export async function uploadProposalPdf(input: UploadInput) {
  // Assuming a default or similar mechanism for PDFs if no endpoint yet
  return uploadFile(API_ENDPOINTS.storage.proposals, input);
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

export async function uploadChatImage(input: UploadInput) {
  return uploadFile(API_ENDPOINTS.storage.chat(input.fileName || ""), input);
}

export async function uploadReviewImage(input: UploadInput) {
  return uploadFile(API_ENDPOINTS.storage.reviews, input);
}

export async function uploadJobRequestImage(input: UploadInput) {
  return uploadFile(API_ENDPOINTS.storage.jobRequests, input);
}

export async function getFileSignedUrl(path: string) {
  try {
    const config = await apiClient<StorageConfig>(
      API_ENDPOINTS.storage.getSignedUrl(path),
      {
        method: "GET",
      },
    ); // URL válida por 60 segundos
    return config.signedUrl || "";
  } catch (error) {
    throw new Error("No se pudo obtener la URL de visualización del archivo.");
  }
}

export async function getProposalSignedUrl(path: string) {
  try {
    const config = await apiClient<StorageConfig>(
      API_ENDPOINTS.storage.getProposalSignedUrl(path),
      {
        method: "GET",
      },
    ); // URL válida por 60 segundos
    return config.signedUrl || "";
  } catch (error) {
    throw new Error("No se pudo obtener la URL de visualización del archivo.");
  }
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

export async function uploadPublicationsImage(url: string, file: Blob) {
  const optimizedFile = await convertToWebP(file);

  await uploadToPresignedUrl(url, optimizedFile);

}

