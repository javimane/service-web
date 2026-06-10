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
  if (params.maxResults)
    query.append("maxResults", params.maxResults.toString());

  const url = `${API_ENDPOINTS.googleCalendar.events}?${query.toString()}`;

  try {
    const rawResponse = await apiClient<any>(url, {
      method: "GET",
    });

    const items = rawResponse.items || [];
    const mappedEvents = items.map((item: any) => ({
      id: item.id,
      title: item.summary || "Sin título",
      description: item.description || "",
      location: item.location || "",
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
    }));

    return {
      data: mappedEvents,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error,
    };
  }
}

export async function createGoogleCalendarEventAction(eventData: {
  title: string;
  start: string; // ISO datetime
  end: string; // ISO datetime
  description?: string;
  location?: string;
}) {
  const payload = {
    summary: eventData.title,
    description: eventData.description,
    location: eventData.location,
    start: {
      dateTime: eventData.start,
    },
    end: {
      dateTime: eventData.end,
    },
  };

  try {
    const rawResponse = await apiClient<any>(
      API_ENDPOINTS.googleCalendar.events,
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );

    // Si apiClient tira una excepcion, se va al catch.
    // Si no, devolvemos la estructura que espera el frontend.
    return {
      data: {
        id: rawResponse.id,
        title: rawResponse.summary,
        description: rawResponse.description,
        location: rawResponse.location,
        start: rawResponse.start?.dateTime || rawResponse.start?.date,
        end: rawResponse.end?.dateTime || rawResponse.end?.date,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error,
    };
  }
}

export async function deleteGoogleCalendarEventAction(eventId: string) {
  return apiClient<{ data: boolean; error: any }>(
    `${API_ENDPOINTS.googleCalendar.events}/${eventId}`,
    {
      method: "DELETE",
    },
  );
}
