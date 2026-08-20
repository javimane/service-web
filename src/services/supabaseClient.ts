import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Asegura que el token se refresque automáticamente antes de expirar
    autoRefreshToken: true,
    // Persiste la sesión en localStorage para sobrevivir recargas de página
    persistSession: true,
    // Detecta la sesión del callback de OAuth automáticamente
    detectSessionInUrl: true,
  },
  realtime: {
    // Parámetros de conexión del WebSocket de Realtime
    params: {
      // Fuerza el log level a "info" para ver posibles errores de conexión
      log_level: "info",
    },
  },
});

// Cuando la sesión cambia (token rotado o renovado), reconectar el canal Realtime
// para que no use el JWT viejo y evitar el error "unrecognized JWT kid"
if (typeof window !== "undefined") {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "TOKEN_REFRESHED" && session) {
      // Desconectar y reconectar todos los canales Realtime activos con el nuevo token
      supabase.realtime.setAuth(session.access_token);
    }
  });
}

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
