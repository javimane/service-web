import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

type UploadTargetType = "REEL" | "PROFILE";
type UploadUrlResponse = { uploadUrl: string; key: string };

export const multimediaService = {
  /**
   * @route POST /api/videos/upload-url
   * @auth Bearer (intended)
   * @param {string} fileName
   * @param {string} fileType
   * @param {'REEL' | 'PROFILE'} type
   * @returns {Promise<{ uploadUrl: string, key: string }>}
   */
  getUploadUrl: (fileName: string, fileType: string, type: UploadTargetType) =>
    apiClient<UploadUrlResponse>(API_ENDPOINTS.multimedia.uploadUrl, {
      method: "POST",
      body: JSON.stringify({ fileName, fileType, type }),
    }),

  uploadToPresignedUrl: async (uploadUrl: string, file: File) => {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error("No se pudo subir el archivo al bucket de AWS.");
    }
  },
};
