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
    const contentType =
      expectedFileType || file.type || "application/octet-stream";

    // Analizamos si la URL de S3 exige el header Content-Type en las firmas
    const urlObj = new URL(uploadUrl);
    const signedHeaders = (
      urlObj.searchParams.get("X-Amz-SignedHeaders") || ""
    ).toLowerCase();
    const requiresContentType = signedHeaders.includes("content-type");

    let response: Response;

    const executePut = async (headersObj: Record<string, string>) => {
      return await fetch(uploadUrl, {
        method: "PUT",
        headers: headersObj,
        body: file,
      });
    };

    try {
      if (requiresContentType) {
        response = await executePut({ "Content-Type": contentType });
      } else {
        // Si Content-Type no fue firmado en la URL, enviamos con Content-Type y si falla 403 intentamos sin header
        response = await executePut({ "Content-Type": contentType });
        if (response.status === 403) {
          response = await executePut({});
        }
      }
    } catch {
      throw new Error(
        "No se pudo iniciar la subida del archivo. Verifica la configuración de CORS del bucket de S3 o la vigencia de la URL prefirmada.",
      );
    }

    if (!response.ok) {
      throw new Error(
        `Error al subir el archivo a S3 (Status ${response.status}: ${response.statusText}).`,
      );
    }
  },
};
