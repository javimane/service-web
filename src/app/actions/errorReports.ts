"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "@/services/apiClient";
import { buildActionHeaders } from "./_utils/authHeaders";

export interface ErrorReport {
  id: string;
  user_id: string;
  text: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface FindAllErrorReportsResponse {
  items: ErrorReport[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

// 1. Create error report
const createErrorReportSchema = z.object({
  text: z.string().min(1, "El reporte no puede estar vacío").max(5000),
  state: z.string().default("pendiente"),
});

export const createErrorReportAction = publicAction
  .schema(createErrorReportSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/error-reports`;
    try {
      const response = await axios.post(url, parsedInput, {
        headers: await buildActionHeaders(ctx),
      });
      return response.data as ErrorReport;
    } catch (error: any) {
      console.error("Error al crear reporte de error:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al crear reporte de error"
      );
    }
  });

// 2. Find error reports by user ID
const findErrorReportsByUserSchema = z.object({
  userId: z.string().uuid("ID de usuario inválido"),
});

export const getErrorReportsByUserIdAction = publicAction
  .schema(findErrorReportsByUserSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/error-reports/user/${parsedInput.userId}`;
    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx),
      });
      return (response.data ?? []) as ErrorReport[];
    } catch (error: any) {
      console.error("Error al obtener reportes del usuario:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al obtener reportes de errores"
      );
    }
  });

// 3. Find error report by ID
const getErrorReportByIdSchema = z.object({
  id: z.string().uuid(),
});

export const getErrorReportByIdAction = publicAction
  .schema(getErrorReportByIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/error-reports/${parsedInput.id}`;
    try {
      const response = await axios.get(url, {
        headers: await buildActionHeaders(ctx),
      });
      return response.data as ErrorReport;
    } catch (error: any) {
      console.error("Error al obtener reporte por ID:", error.message);
      throw new Error(
        error.response?.data?.message || "Error al obtener detalle del reporte"
      );
    }
  });
