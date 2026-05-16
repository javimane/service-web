export function getAccessToken() {
  if (typeof window === "undefined") return undefined;
  return localStorage.getItem("access_token") || undefined;
}
