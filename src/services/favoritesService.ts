import { API_ENDPOINTS } from "./api.config";
import { supabase } from "./supabaseClient";

/**
 * Service to handle user favorite professionals.
 * Uses the API endpoints defined in api.config.ts.
 */
export const favoritesService = {
  /**
   * Get all favorite professionals for the current user.
   */
  async getFavorites() {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(API_ENDPOINTS.users.favorites, {
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch favorites");
    }

    return await response.json();
  },

  /**
   * Add a professional to the user's favorites.
   */
  async addFavorite(professionalId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(API_ENDPOINTS.users.favorites, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ professionalId }),
    });

    if (!response.ok) {
      throw new Error("Failed to add favorite");
    }

    return await response.json();
  },

  /**
   * Remove a professional from the user's favorites.
   */
  async removeFavorite(professionalId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(API_ENDPOINTS.users.favoriteDetail(professionalId), {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${session?.access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to remove favorite");
    }

    return await response.json();
  },
};
