import { z } from "zod";

console.log("[env.ts] Module loaded");

const envSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: z.string().url().default("http://localhost:3000"),
  WEB_API_KEY: z.string().default("MISSING_API_KEY"),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  WEB_API_KEY: process.env.WEB_API_KEY,
});

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment variables");
}

export const env = parsed.data;

if (env.WEB_API_KEY === "MISSING_API_KEY" && process.env.NODE_ENV !== "production") {
  console.warn("⚠️  WEB_API_KEY is missing in environment variables. Server Actions might fail.");
}

