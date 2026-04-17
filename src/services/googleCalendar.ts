/**
 * Google Calendar integration service.
 *
 * Required env vars (add to .env):
 *   VITE_GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
 *   VITE_GOOGLE_API_KEY=<your-api-key>
 *
 * Google Cloud Console setup:
 *   1. Enable "Google Calendar API"
 *   2. Create OAuth 2.0 Client ID (Web application)
 *   3. Add http://localhost:5173 (and production URL) to authorised JS origins
 *   4. Create an API key and restrict it to Calendar API
 */

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY ?? "";
const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";
const SCOPES = "https://www.googleapis.com/auth/calendar";

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiInited = false;
let gisInited = false;

// ── helpers ────────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ── initialisation ─────────────────────────────────────────────

async function initGapi() {
  if (gapiInited) return;
  await loadScript("https://apis.google.com/js/api.js");
  await new Promise<void>((resolve) => gapi.load("client", resolve));
  await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
  gapiInited = true;
}

async function initGis(): Promise<google.accounts.oauth2.TokenClient> {
  if (tokenClient) return tokenClient;
  await loadScript("https://accounts.google.com/gsi/client");
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: () => {},
  });
  gisInited = true;
  return tokenClient;
}

export async function initGoogleCalendar() {
  await Promise.all([initGapi(), initGis()]);
}

// ── auth ───────────────────────────────────────────────────────

export function requestAccessToken(): Promise<google.accounts.oauth2.TokenResponse> {
  return new Promise(async (resolve, reject) => {
    const client = await initGis();
    client.callback = (resp) => {
      if (resp.error) {
        reject(resp);
        return;
      }
      resolve(resp);
    };

    if (gapi.client.getToken() === null) {
      client.requestAccessToken({ prompt: "consent" });
    } else {
      client.requestAccessToken({ prompt: "" });
    }
  });
}

export function isSignedIn(): boolean {
  return gapi.client?.getToken?.() != null;
}

export function signOut() {
  const token = gapi.client.getToken();
  if (token) {
    google.accounts.oauth2.revoke(token.access_token, () => {});
    gapi.client.setToken(null);
  }
}

// ── calendar events ────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  description?: string;
  location?: string;
};

export async function listEvents(
  timeMin: string,
  timeMax: string,
): Promise<CalendarEvent[]> {
  const resp = await gapi.client.calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 250,
  });

  return (resp.result.items ?? []).map((e: any) => ({
    id: e.id,
    title: e.summary ?? "(Sin título)",
    start: e.start.dateTime ?? e.start.date,
    end: e.end.dateTime ?? e.end.date,
    description: e.description,
    location: e.location,
  }));
}

export async function createEvent(event: {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}): Promise<CalendarEvent> {
  const resp = await gapi.client.calendar.events.insert({
    calendarId: "primary",
    resource: {
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.end,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    },
  });

  const e = resp.result;
  return {
    id: e.id,
    title: e.summary ?? event.title,
    start: e.start.dateTime ?? e.start.date,
    end: e.end.dateTime ?? e.end.date,
    description: e.description,
    location: e.location,
  };
}

export async function deleteEvent(eventId: string): Promise<void> {
  await gapi.client.calendar.events.delete_({
    calendarId: "primary",
    eventId,
  });
}

export async function updateEvent(
  eventId: string,
  updates: Partial<{
    title: string;
    start: string;
    end: string;
    description: string;
    location: string;
  }>,
): Promise<CalendarEvent> {
  const resource: Record<string, any> = {};
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (updates.title != null) resource.summary = updates.title;
  if (updates.description != null) resource.description = updates.description;
  if (updates.location != null) resource.location = updates.location;
  if (updates.start != null)
    resource.start = { dateTime: updates.start, timeZone: tz };
  if (updates.end != null)
    resource.end = { dateTime: updates.end, timeZone: tz };

  const resp = await gapi.client.calendar.events.patch({
    calendarId: "primary",
    eventId,
    resource,
  });

  const e = resp.result;
  return {
    id: e.id,
    title: e.summary,
    start: e.start.dateTime ?? e.start.date,
    end: e.end.dateTime ?? e.end.date,
    description: e.description,
    location: e.location,
  };
}
