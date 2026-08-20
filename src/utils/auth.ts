export function getAccessToken() {
  if (typeof window === "undefined") return undefined;

  // Leer siempre desde la sesión de Supabase (que se rota correctamente).
  // No usar localStorage["access_token"] como fuente primaria porque ese
  // valor no se actualiza cuando el servidor rota el token, causando
  // errores 401 con "unrecognized JWT kid".
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
