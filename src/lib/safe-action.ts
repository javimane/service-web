import { createSafeActionClient } from "next-safe-action";
import axios from "axios";
import { env } from "./env";

export const actionClient = createSafeActionClient();

// Ensure server-side axios requests include the API key by default.
const WEB_API_KEY = env.WEB_API_KEY || process.env.WEB_API_KEY;
axios.defaults.headers.common["x-api-key"] = WEB_API_KEY;

// Global interceptor to ensure x-api-key is ALWAYS present on server-side requests
axios.interceptors.request.use((config) => {
  // Try multiple ways to set it just in case
  config.headers["x-api-key"] = WEB_API_KEY;
  if (config.headers.set) {
    config.headers.set("x-api-key", WEB_API_KEY);
  }

  if (process.env.NODE_ENV !== "production") {
    console.info(`[Axios Interceptor] Sending to: ${config.url}`);
    console.info(
      `[Axios Interceptor] Headers keys: ${Object.keys(config.headers).join(", ")}`,
    );
  }

  return config;
});

export const publicAction = actionClient.use(async ({ next, ctx }) => {
  const apiKey = env.WEB_API_KEY || process.env.WEB_API_KEY || "MISSING";

  const mergedHeaders = {
    ...((ctx as any)?.headers || {}),
    "x-api-key": apiKey,
  };

  const result = await next({
    ctx: {
      ...(ctx || {}),
      headers: mergedHeaders,
    },
  });

  return result;
});
