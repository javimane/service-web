import { userService } from "./userService";

/**
 * Service to handle user favorite professionals.
 * Uses the API endpoints defined in api.config.ts via userService.
 */
export const favoritesService = {
  /**
   * Get all favorite professionals for the current user.
   */
  async getFavorites() {
    return userService.getFavorites();
  },

  /**
   * Add a professional to the user's favorites.
   */
  async addFavorite(professionalId: string) {
    return userService.addFavorite(professionalId);
  },

  /**
   * Remove a professional from the user's favorites.
   */
  async removeFavorite(professionalId: string) {
    return userService.removeFavorite(professionalId);
  },
};
