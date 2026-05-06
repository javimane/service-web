import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

type UploadTargetType = "REEL" | "PROFILE";
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

  uploadToPresignedUrl: async (uploadUrl: string, file: File) => {
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
  },
};
