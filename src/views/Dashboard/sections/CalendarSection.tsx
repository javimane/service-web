"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
  createViewDay,
  createViewWeek,
  createViewMonthGrid,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import { createCalendarControlsPlugin } from "@schedule-x/calendar-controls";
import "temporal-polyfill/global";
import "@schedule-x/theme-default/dist/index.css";
import {
  Calendar as CalendarIcon,
  Plus,
  LogIn,
  LogOut,
  RefreshCw,
  Clock,
  MapPin,
  AlignLeft,
  X,
  CalendarDays,
  CalendarRange,
  CalendarClock,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  getGoogleCalendarEventsAction,
  createGoogleCalendarEventAction,
  deleteGoogleCalendarEventAction,
  type BackendCalendarEvent as CalendarEvent,
} from "../../../app/actions/googleCalendar";
import { supabase } from "../../../services/supabaseClient";
import { authService } from "../../../services/authService";
import "./CalendarSection.css";

type ViewKey = "month-grid" | "week" | "day";

// ── helpers ────────────────────────────────────────────────────

function toLocalISO(date: string, time: string): string {
  return `${date}T${time}:00`;
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

function nowDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function addHour(time: string) {
  const [h, m] = time.split(":").map(Number);
  return `${pad(Math.min(h + 1, 23))}:${pad(m)}`;
}

function formatDateLabel(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const formatForScheduleX = (isoString: any) => {
  if (!isoString) return "";
  let dateStr = "";
  if (typeof isoString === "string") {
    dateStr = isoString;
  } else if (typeof isoString === "object") {
    dateStr = isoString.dateTime || isoString.date || "";
  }
  if (!dateStr) return "";

  try {
    const Temporal = (window as any).Temporal;
    if (!Temporal) return "";

    if (dateStr.includes("T")) {
      // Tiene hora y fecha, crear ZonedDateTime
      const instant = Temporal.Instant.from(dateStr);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return instant.toZonedDateTimeISO(tz);
    } else {
      // Es PlainDate
      return Temporal.PlainDate.from(dateStr.split("T")[0]);
    }
  } catch (err) {
    console.error("Error formatting date for Schedule-X", err);
    return "";
  }
};

// ── component ──────────────────────────────────────────────────

export default function CalendarSection() {
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [gcalEvents, setGcalEvents] = useState<CalendarEvent[]>([]);
  const [activeView, setActiveView] = useState<ViewKey>("month-grid");

  // new-event modal
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    date: nowDate(),
    startTime: nowTime(),
    endTime: addHour(nowTime()),
    description: "",
    location: "",
  });
  const [formError, setFormError] = useState("");

  // schedule-x plugins
  const eventsService = useMemo(() => createEventsServicePlugin(), []);
  const eventModal = useMemo(() => createEventModalPlugin(), []);
  const calendarControls = useMemo(() => createCalendarControlsPlugin(), []);

  const calendar = useCalendarApp({
    locale: "es-ES",
    views: [createViewMonthGrid(), createViewWeek(), createViewDay()],
    defaultView: createViewMonthGrid().name,
    events: [],
    plugins: [eventsService, eventModal, calendarControls],
    callbacks: {
      onEventClick(event) {
        // handled by event-modal plugin
      },
    },
  });

  // ── sync helpers ───────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    setSyncing(true);
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);

      const response = await getGoogleCalendarEventsAction({
        timeMin: start.toISOString(),
        timeMax: end.toISOString(),
      });

      if (response.error) {
        setConnected(false);
        return;
      }

      setConnected(true);
      const events = response.data || [];
      setGcalEvents(events);

      // update schedule-x
      const sxEvents = events
        .filter((e: any) => e.start && e.end)
        .map((e: any) => ({
          id: e.id,
          title: e.title,
          start: formatForScheduleX(e.start as string),
          end: formatForScheduleX(e.end as string),
          description: e.description ?? "",
          location: e.location ?? "",
        }))
        .filter((e: any) => e.start && e.end);

      eventsService.set(sxEvents as any);
    } catch (err) {
      console.error("Error fetching calendar events:", err);
      setConnected(false);
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, [eventsService]);

  // ── init ───────────────────────────────────────────────────

  useEffect(() => {
    const initBackendCalendar = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const providerToken = session?.provider_token;
        const providerRefreshToken = session?.provider_refresh_token;

        if (
          providerToken &&
          providerToken !== "null" &&
          providerToken !== "undefined" &&
          providerRefreshToken &&
          providerRefreshToken !== "null" &&
          providerRefreshToken !== "undefined"
        ) {
          console.log("Linking Google Calendar tokens found in session...");
          await authService.linkGoogleCalendarTokens({
            google_access_token: providerToken,
            google_refresh_token: providerRefreshToken,
          });
        }
        await fetchEvents();
      } catch (err) {
        console.error("Error init backend calendar", err);
        setLoading(false);
      }
    };
    initBackendCalendar();
  }, [fetchEvents]);

  // ── auth ───────────────────────────────────────────────────

  // El botón manual fue eliminado ya que el login de Google captura
  // y almacena los tokens de Google Calendar automáticamente en la API.

  //const handleDisconnect = () => {
  //  setConnected(false);
  //  setGcalEvents([]);
  //  eventsService.set([]);
  //};

  // ── create event ───────────────────────────────────────────

  const handleCreateEvent = async () => {
    if (!form.title.trim()) {
      setFormError("El título es obligatorio");
      return;
    }

    const start = toLocalISO(form.date, form.startTime);
    const end = toLocalISO(form.date, form.endTime);

    if (new Date(end) <= new Date(start)) {
      setFormError("La hora de fin debe ser mayor a la de inicio");
      return;
    }

    setFormError("");
    setSyncing(true);
    try {
      const response = await createGoogleCalendarEventAction({
        title: form.title,
        start,
        end,
        description: form.description,
        location: form.location,
      });

      if (response.error || !response.data) {
        throw new Error("Failed to create event in backend");
      }

      const created = response.data;

      eventsService.add({
        id: created.id,
        title: created.title,
        start: formatForScheduleX(created.start as string),
        end: formatForScheduleX(created.end as string),
        description: created.description ?? "",
        location: created.location ?? "",
      } as any);

      setGcalEvents((prev) => [...prev, created]);
      setShowModal(false);
      setForm({
        title: "",
        date: nowDate(),
        startTime: nowTime(),
        endTime: addHour(nowTime()),
        description: "",
        location: "",
      });
    } catch (err) {
      console.error("Error creating event:", err);
      setFormError("No se pudo crear el evento. Intentá de nuevo.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta cita?")) return;

    try {
      setSyncing(true);
      const res = await deleteGoogleCalendarEventAction(eventId);
      if (res.error) {
        console.error("Error al eliminar la cita:", res.error);
        alert("Ocurrió un error al eliminar la cita.");
        return;
      }
      eventsService.remove(eventId);
      setGcalEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (e) {
      console.error(e);
      alert("Ocurrió un error al eliminar la cita.");
    } finally {
      setSyncing(false);
    }
  };

  // ── derived ────────────────────────────────────────────────

  const upcomingEvents = gcalEvents
    .filter((e) => new Date(e.start) >= new Date())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 5);

  // ── render ─────────────────────────────────────────────────

  const hasCredentials = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const viewOptions: {
    key: ViewKey;
    label: string;
    icon: typeof CalendarDays;
  }[] = [
    { key: "month-grid", label: "Mes", icon: CalendarDays },
    { key: "week", label: "Semana", icon: CalendarRange },
    { key: "day", label: "Día", icon: CalendarClock },
  ];

  const switchView = (view: ViewKey) => {
    setActiveView(view);
    calendarControls.setView(view);
  };

  return (
    <div className="calendar-section">
      {/* Header */}
      <div className="calendar-section__header">
        <div className="calendar-section__header-left">
          <div className="calendar-section__icon-badge">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h1 className="calendar-section__title">Calendario</h1>
            <p className="calendar-section__subtitle">
              Agendá y gestioná tus citas sincronizadas con Google Calendar.
            </p>
          </div>
        </div>
        <div className="calendar-section__actions">
          {connected && (
            <>
              <button
                type="button"
                className="cal-btn cal-btn--secondary"
                onClick={fetchEvents}
                disabled={syncing}
              >
                <RefreshCw size={15} className={syncing ? "spinning" : ""} />
                <span className="cal-btn__label">Sincronizar</span>
              </button>
              <button
                type="button"
                className="cal-btn cal-btn--primary"
                onClick={() => setShowModal(true)}
              >
                <Plus size={15} />
                <span className="cal-btn__label">Nueva Cita</span>
              </button>
            </>
          )}
          {!connected && !loading && !syncing && (
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "var(--text-sm)",
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
              }}
            >
              <CalendarClock size={16} />
              <span>
                Sincronizado automáticamente si iniciaste sesión con Google.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Connection status */}
      {!hasCredentials && (
        <div className="cal-notice">
          <div className="cal-notice__icon">
            <CalendarIcon size={18} />
          </div>
          <div>
            <strong>Configuración pendiente</strong>
            <p>
              Agregá <code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> y{" "}
              <code>NEXT_PUBLIC_GOOGLE_API_KEY</code> a tu archivo{" "}
              <code>.env.local</code> para habilitar la sincronización con
              Google Calendar.
            </p>
          </div>
        </div>
      )}

      {/* View Switcher + Calendar + sidebar */}
      {(connected || !hasCredentials) && (
        <>
          {/* Custom view switcher — always visible */}
          <div className="cal-view-switcher">
            {viewOptions.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={`cal-view-switcher__btn ${activeView === key ? "cal-view-switcher__btn--active" : ""}`}
                onClick={() => switchView(key)}
              >
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="calendar-section__body">
            <div className="calendar-section__calendar">
              <ScheduleXCalendar calendarApp={calendar} />
            </div>

            <div className="calendar-section__side">
              {connected ? (
                <>
                  <div className="upcoming-card">
                    <div className="upcoming-card__header">
                      <h3>Próximas Citas</h3>
                      <span className="upcoming-card__count">
                        {upcomingEvents.length}
                      </span>
                    </div>
                    {upcomingEvents.length === 0 ? (
                      <div className="upcoming-empty">
                        <CalendarIcon size={28} />
                        <p>No hay citas próximas</p>
                      </div>
                    ) : (
                      <ul className="upcoming-list">
                        {upcomingEvents.map((ev) => (
                          <li key={ev.id} className="upcoming-item">
                            <div className="upcoming-item__accent" />
                            <div className="upcoming-item__info">
                              <span className="upcoming-item__title">
                                {ev.title}
                              </span>
                              <span className="upcoming-item__time">
                                <Clock size={12} />
                                {formatDateLabel(ev.start)}
                              </span>
                              {ev.location && (
                                <span className="upcoming-item__location">
                                  <MapPin size={12} />
                                  {ev.location}
                                </span>
                              )}
                            </div>
                            <button 
                              className="upcoming-item__delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(ev.id);
                              }}
                              title="Eliminar cita"
                            >
                              <Trash2 size={14} />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              ) : (
                <div className="upcoming-card upcoming-card--placeholder">
                  <div className="upcoming-card__header">
                    <h3>Próximas Citas</h3>
                  </div>
                  <div className="upcoming-empty">
                    <CalendarIcon size={28} />
                    <p>Conectá Google Calendar para ver tus citas</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* New event modal */}
      {showModal && (
        <div className="cal-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cal-modal__header">
              <h2>Nueva Cita</h2>
              <button
                type="button"
                className="cal-modal__close"
                onClick={() => setShowModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="cal-modal__body">
              <div className="cal-field">
                <label>
                  <CalendarIcon size={14} /> Título *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Reunión con cliente"
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                />
              </div>

              <div className="cal-field">
                <label>
                  <Clock size={14} /> Fecha
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, date: e.target.value }))
                  }
                />
              </div>

              <div className="cal-field-row">
                <div className="cal-field">
                  <label>Inicio</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, startTime: e.target.value }))
                    }
                  />
                </div>
                <div className="cal-field">
                  <label>Fin</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, endTime: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="cal-field">
                <label>
                  <MapPin size={14} /> Ubicación
                </label>
                <input
                  type="text"
                  placeholder="Dirección o enlace de videollamada"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                />
              </div>

              <div className="cal-field">
                <label>
                  <AlignLeft size={14} /> Descripción
                </label>
                <textarea
                  rows={3}
                  placeholder="Notas sobre la cita..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                />
              </div>

              {formError && <p className="cal-field-error">{formError}</p>}
            </div>

            <div className="cal-modal__footer">
              <button
                type="button"
                className="cal-btn cal-btn--secondary"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="cal-btn cal-btn--primary"
                onClick={handleCreateEvent}
              >
                <Plus size={16} />
                Crear Cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
