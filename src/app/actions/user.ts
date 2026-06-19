"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const deleteUserAccountAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .optional(),
  )
  .action(async ({ parsedInput, ctx }) => {
    // Attempting /api/users/me. If the controller is /user, this might need an update.
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/users/me`;

    try {
      const response = await axios.delete(url, {
        headers: await buildActionHeaders(ctx, parsedInput?.token),
      });
      return response.data;
    } catch (error: any) {
      console.error(
        "Error deleting user account:",
        error.response?.data || error.message,
      );
      throw new Error(
        error.response?.data?.message || "Error al eliminar la cuenta",
      );
    }
  });
