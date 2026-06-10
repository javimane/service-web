import { API_ENDPOINTS } from "../../services/api.config";
import { apiClient } from "../../services/apiClient";

export type BackendCalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO datetime
  end: string;
  description?: string;
  location?: string;
};

export async function getGoogleCalendarEventsAction(params: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
}) {
  const query = new URLSearchParams();
  if (params.timeMin) query.append("timeMin", params.timeMin);
  if (params.timeMax) query.append("timeMax", params.timeMax);
  if (params.maxResults) query.append("maxResults", params.maxResults.toString());

  const url = `${API_ENDPOINTS.googleCalendar.events}?${query.toString()}`;

  return apiClient<{ data: BackendCalendarEvent[]; error: any }>(url, {
    method: "GET",
  });
}

export async function createGoogleCalendarEventAction(eventData: {
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  description?: string;
  location?: string;
}) {
  return apiClient<{ data: BackendCalendarEvent; error: any }>(
    API_ENDPOINTS.googleCalendar.events,
    {
      method: "POST",
      body: JSON.stringify(eventData),
    }
  );
}

export async function deleteGoogleCalendarEventAction(eventId: string) {
  return apiClient<{ data: boolean; error: any }>(
    `${API_ENDPOINTS.googleCalendar.events}/${eventId}`,
    {
      method: "DELETE",
    }
  );
}
