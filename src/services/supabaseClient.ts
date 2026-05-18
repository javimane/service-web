import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const clearSupabaseSession = async () => {
  if (typeof window !== "undefined") {
    await supabase.auth.signOut().catch((err) =>
      console.error("Error signing out Supabase:", err)
    );
  }
};

if (typeof window !== "undefined") {
  // Escucha el evento session-expired emitido por tu componente SessionTimeoutOverlay u otros
  window.addEventListener("session-expired", async () => {
    await clearSupabaseSession();
  });
}
