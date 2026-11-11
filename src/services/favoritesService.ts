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
   * Add a professional, product, or service to the user's favorites.
   */
  async addFavorite(
    target:
      | string
      | number
      | {
          professionalId?: string | number;
          productId?: string;
          serviceId?: string;
        },
  ) {
    return userService.addFavorite(target);
  },

  /**
   * Remove a favorite by ID or target ID.
   */
  async removeFavorite(id: string | number) {
    return userService.removeFavorite(id);
  },
};
