import { API_ENDPOINTS } from "./api.config";
import { apiClient } from "./apiClient";

export const multimediaService = {
  /**
   * @route POST /api/videos/upload-url
   * @auth Bearer (intended)
   * @param {string} fileName
   * @param {string} fileType
   * @param {'REEL' | 'PROFILE'} type
   * @returns {Promise<{ uploadUrl: string, key: string }>}
   */
  getUploadUrl: (fileName: string, fileType: string, type: 'REEL' | 'PROFILE') => 
    apiClient<{ uploadUrl: string, key: string }>(API_ENDPOINTS.multimedia.uploadUrl, {
      method: "POST",
      body: JSON.stringify({ fileName, fileType, type }),
    }),
};
