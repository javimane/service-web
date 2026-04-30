/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MP_BASIC_CHECKOUT_URL: string;
  readonly VITE_MP_PREMIUM_CHECKOUT_URL: string;
  readonly VITE_ARCA_VERIFY_ENDPOINT: string;
  readonly VITE_SUPABASE_PROJECT_REF?: string;
  readonly VITE_SUPABASE_PROJECT_REGION?: string;
  readonly VITE_SUPABASE_STORAGE_S3_ENDPOINT?: string;
  readonly VITE_SUPABASE_BUCKET_PROPOSAL_PDFS?: string;
  readonly VITE_SUPABASE_BUCKET_PROMOTION_IMAGES?: string;
  readonly VITE_SUPABASE_BUCKET_PROFILE_IMAGES?: string;
  readonly VITE_SUPABASE_BUCKET_PROFILE_WORK_IMAGES?: string;
  readonly VITE_SUPABASE_BUCKET_PRODUCT_IMAGES?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare global {
  interface Window {
    google: any;
  }
}

export {};
