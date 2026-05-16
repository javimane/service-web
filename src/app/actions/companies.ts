"use server";

import { z } from "zod";
import { publicAction } from "@/lib/safe-action";
import { env } from "@/lib/env";
import axios from "axios";
import { buildActionHeaders } from "./_utils/authHeaders";

const authTokenSchema = z.string().optional();

export const getCompaniesAction = publicAction
  .schema(z.void())
  .action(async ({ ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/companies`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching companies",
      );
    }
  });

export const getCompanyDetailAction = publicAction
  .schema(z.object({ id: z.string().or(z.number()) }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/companies/${parsedInput.id}`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching company detail",
      );
    }
  });

export const getCompanyByProfessionalAction = publicAction
  .schema(z.object({ professionalId: z.coerce.number() }))
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/companies/professional/${parsedInput.professionalId}`;
    try {
      const response = await axios.get(url, { headers: ctx.headers });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          "Error fetching company by professional",
      );
    }
  });

export const getArcaCompanyAction = publicAction
  .schema(
    z.object({
      id: z.number(),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/arca/company/${parsedInput.id}`;
    try {
      const response = await axios.get(url, {
        headers: buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error fetching ARCA company",
      );
    }
  });

export const arcaVerifyAction = publicAction
  .schema(
    z.object({
      cuit: z.string(),
      companyName: z.string(),
      professionalId: z.string().or(z.number()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/arca/verify/${parsedInput.cuit}/${encodeURIComponent(parsedInput.companyName)}/${parsedInput.professionalId}`;
    try {
      const response = await axios.get(url, {
        headers: buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Error verifying ARCA");
    }
  });

export const createCompanyAction = publicAction
  .schema(
    z
      .object({
        token: authTokenSchema,
      })
      .catchall(z.any()),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/companies`;
    const { token, ...data } = parsedInput;
    try {
      const response = await axios.post(url, data, {
        headers: buildActionHeaders(ctx, token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error creating company",
      );
    }
  });

export const updateCompanyAction = publicAction
  .schema(
    z.object({
      id: z.string().or(z.number()),
      data: z.record(z.string(), z.any()),
      token: authTokenSchema,
    }),
  )
  .action(async ({ parsedInput, ctx }) => {
    const url = `${env.NEXT_PUBLIC_API_BASE_URL}/api/companies/${parsedInput.id}`;
    try {
      const response = await axios.put(url, parsedInput.data, {
        headers: buildActionHeaders(ctx, parsedInput.token),
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || "Error updating company",
      );
    }
  });
