export function getAccessToken() {
  if (typeof window === "undefined") return undefined;
  
  const manual = localStorage.getItem("access_token");
  if (manual) return manual;

  // Intentar obtener el token de la sesión de Supabase
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
      try {
        const session = JSON.parse(localStorage.getItem(key) || "{}");
        if (session && session.access_token) {
          return session.access_token;
        }
      } catch (e) {
        // Ignorar errores de parseo
      }
    }
  }
  
  return undefined;
}
