import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

type UploadTargetType = "REEL" | "PROFILE" | "PRODUCT";
type UploadUrlResponse = { uploadUrl: string; key: string };

export const multimediaService = {
  /**
   * @route POST /api/videos/upload-url
   * @auth Bearer (intended)
   * @param {number} professionalId
   * @param {string} fileName
   * @param {string} fileType
   * @param {'REEL' | 'PROFILE'} type
   * @returns {Promise<{ uploadUrl: string, key: string }>}
   */
  /**
   * @route POST /api/videos/upload-url
   * @auth Bearer (intended)
   * @param {number} professionalId
   * @param {string} fileName
   * @param {string} fileType
   * @param {'REEL' | 'PROFILE' | 'PRODUCT'} type
   * @returns {Promise<{ uploadUrl: string, key: string }>}
   */
  getUploadUrl: (
    professionalId: number,
    fileName: string,
    fileType: string,
    type: UploadTargetType,
  ) =>
    apiClient<UploadUrlResponse>(API_ENDPOINTS.multimedia.uploadUrl, {
      method: "POST",
      body: JSON.stringify({ professionalId, fileName, fileType, type }),
    }),

  uploadToPresignedUrl: async (
    uploadUrl: string,
    file: File,
    expectedFileType?: string,
  ) => {
    // Es CRÍTICO que el Content-Type coincida EXACTAMENTE con el enviado al backend
    // al solicitar la presigned URL (fileType). Si difiere o no se envía, S3 responde 403 Forbidden.
    const contentType =
      expectedFileType || file.type || "application/octet-stream";

    let response: Response;
    try {
      response = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
        },
        body: file,
      });
    } catch {
      throw new Error(
        "No se pudo iniciar la subida del archivo. Verifica la configuración de CORS del bucket de S3 o la vigencia de la URL prefirmada.",
      );
    }

    if (!response.ok) {
      throw new Error(
        `Error al subir el archivo a S3 (Status ${response.status}: ${response.statusText}). Asegúrate de que el Content-Type coincida exactamente.`,
      );
    }
  },
};
