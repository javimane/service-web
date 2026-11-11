"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  GoogleMap,
  MarkerF,
  PolylineF,
  useJsApiLoader,
} from "@react-google-maps/api";
import { MapPin, MessageCircle, Package, Send, Truck, X } from "lucide-react";
import { commerceService } from "@/services/commerceService";
import { getMessagesAction, sendMessageAction } from "@/app/actions/chat";
import "./BuyerShipmentMap.css";

type Point =
  | {
      latitude?: number | null;
      longitude?: number | null;
      lat?: number | null;
      lng?: number | null;
    }
  | [number, number]
  | null;
type Tracking = {
  status: string;
  estimated_delivery_at?: string | null;
  OriginAddress?: Point & { street_name?: string; street_number?: string };
  DeliveryAddress?: Point & { street_name?: string; street_number?: string };
  location?: Point;
  route?: Point[];
  remaining_route?: Point[];
  route_polyline?: Array<[number, number]>;
  route_attribution?: string | null;
  delivery_driver_id?: string | null;
  buyer_security_code?: string | null;
  rider?: {
    name?: string | null;
    vehicle_type?: string | null;
    plate_suffix?: string | null;
  } | null;
};

const apiKey =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_API_KEY ||
  "";

function coords(point: Point): google.maps.LatLngLiteral | null {
  if (!point) return null;
  let lat: number | undefined;
  let lng: number | undefined;

  if (Array.isArray(point)) {
    lat = Number(point[0]);
    lng = Number(point[1]);
  } else if (typeof point === "object") {
    lat = Number(point.lat ?? point.latitude);
    lng = Number(point.lng ?? point.longitude);
  }

  return Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat! >= -90 &&
    lat! <= 90 &&
    lng! >= -180 &&
    lng! <= 180 &&
    (lat !== 0 || lng !== 0)
    ? { lat: lat!, lng: lng! }
    : null;
}

function vehicleLabel(value?: string | null) {
  switch (value?.toLowerCase()) {
    case "car":
    case "auto":
      return "Auto";
    case "motorcycle":
    case "motorbike":
    case "moto":
      return "Moto";
    case "bicycle":
    case "bike":
    case "bicicleta":
      return "Bicicleta";
    case "van":
    case "pickup":
    case "camioneta":
      return "Camioneta";
    case "truck":
    case "camion":
    case "camión":
      return "Camión";
    default:
      return "Vehículo por confirmar";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "returning_to_store":
      return "Cancelado · regresa al comercio";
    case "in_transit":
      return "En camino";
    case "ready_for_pickup":
      return "Listo para retirar";
    case "driver_assigned":
      return "Rider asignado";
    case "preparing":
      return "En preparación";
    case "delivered":
      return "Entregado";
    default:
      return "Preparando envío";
  }
}

function addressLabel(
  address?: Tracking["OriginAddress"] | Tracking["DeliveryAddress"],
) {
  return (
    [address?.street_name, address?.street_number].filter(Boolean).join(" ") ||
    null
  );
}

export default function BuyerShipmentMap({
  orderId,
  orderNumber,
  currentUserId,
}: {
  orderId: string;
  orderNumber?: string | null;
  currentUserId: string;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [hasRoadRoute, setHasRoadRoute] = useState(false);
  const [currentTimestamp] = useState(() => Date.now());
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useQuery<Tracking>({
    queryKey: ["buyer-shipment-map", orderId],
    queryFn: () => commerceService.orderShipment(orderId),
    refetchInterval: 15_000,
  });
  const riderId = data?.delivery_driver_id || "";
  const chatKey = ["buyer-rider-messages", currentUserId, riderId];
  const { data: messages, isError: messagesError } = useQuery({
    queryKey: chatKey,
    queryFn: () =>
      getMessagesAction({ userId: currentUserId, receiverId: riderId }),
    enabled: chatOpen && Boolean(currentUserId && riderId),
    refetchInterval: chatOpen ? 5_000 : false,
  });
  const sendMessage = useMutation({
    mutationFn: (content: string) =>
      sendMessageAction({
        senderId: currentUserId,
        receiverId: riderId,
        content,
      }),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: chatKey });
    },
  });

  const origin = useMemo(
    () => coords(data?.OriginAddress ?? null),
    [data?.OriginAddress],
  );
  const destination = useMemo(
    () => coords(data?.DeliveryAddress ?? null),
    [data?.DeliveryAddress],
  );
  const rider = useMemo(
    () =>
      data &&
      (data.status === "in_transit" ||
        data.status === "picked_up" ||
        data.status === "driver_at_store")
        ? coords(data.location ?? null)
        : null,
    [data],
  );
  const recorded = useMemo(
    () =>
      data && (data.status === "in_transit" || data.status === "picked_up")
        ? (data.route ?? [])
            .map(coords)
            .filter((p): p is google.maps.LatLngLiteral => Boolean(p))
        : [],
    [data],
  );
  const rawRemaining = useMemo(() => {
    if (!data) return [];
    if (data.remaining_route && data.remaining_route.length > 0) {
      return data.remaining_route;
    }
    if (data.route_polyline && data.route_polyline.length > 0) {
      return data.route_polyline;
    }
    return [];
  }, [data]);

  const remaining = useMemo(
    () =>
      data &&
      (data.status === "in_transit" ||
        data.status === "picked_up" ||
        data.status === "driver_at_store")
        ? rawRemaining
            .map(coords)
            .filter((p): p is google.maps.LatLngLiteral => Boolean(p))
        : [],
    [data, rawRemaining],
  );
  const center = rider ?? destination ?? origin;
  const estimatedAt = useMemo(
    () =>
      data?.estimated_delivery_at
        ? new Date(data.estimated_delivery_at)
        : null,
    [data?.estimated_delivery_at],
  );
  const arrivalText = useMemo(
    () =>
      estimatedAt &&
      Number.isFinite(estimatedAt.getTime()) &&
      estimatedAt.getTime() > currentTimestamp
        ? new Intl.DateTimeFormat("es-AR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(estimatedAt)
        : null,
    [estimatedAt, currentTimestamp],
  );

  if (isLoading) return <p>Cargando el seguimiento…</p>;
  if (isError || !data)
    return (
      <p>No se pudo cargar el seguimiento. Intentá actualizar la compra.</p>
    );
  if (data.status === "delivered") {
    return <p role="status">Entregado. El mapa del envío ya no está disponible.</p>;
  }

  return (
    <section className="buyer-shipment-map" aria-label="Seguimiento del envío">
      <div className="buyer-shipment-map__map">
        {center && apiKey ? (
          <LoadedMap
            center={center}
            origin={origin}
            destination={destination}
            rider={rider}
            recorded={recorded}
            remaining={remaining}
            riderName={data.rider?.name}
            onHasRoadRoute={setHasRoadRoute}
          />
        ) : (
          <div className="buyer-shipment-map__map-empty">
            {!apiKey
              ? "Mapa no disponible"
              : "Esperando la ubicación del envío"}
          </div>
        )}
        <div className="buyer-shipment-map__map-label">
          <MapPin size={17} /> Seguimiento en vivo
        </div>
      </div>
      <div className="buyer-shipment-map__panel">
        <div className="buyer-shipment-map__handle" aria-hidden="true" />
        <div className="buyer-shipment-map__heading">
          <div>
            <span className="buyer-shipment-map__eyebrow">TU COMPRA</span>
            <h4>Pedido #{orderNumber || orderId.slice(0, 8)}</h4>
          </div>
          <span className="buyer-shipment-map__status">
            {statusLabel(data.status)}
          </span>
        </div>
        <div className="buyer-shipment-map__progress" aria-hidden="true">
          <span />
        </div>
        <p className="buyer-shipment-map__eta">
          {arrivalText
            ? `Llegada estimada: ${arrivalText}`
            : data.status === "returning_to_store"
              ? "El rider devuelve el paquete al comercio"
            : data.status === "in_transit"
              ? "El rider está en camino"
              : "Te avisaremos cuando el rider salga"}
        </p>
        <div className="buyer-shipment-map__locations">
          <div>
            <Package size={19} />
            <span>
              <small>Desde</small>
              {addressLabel(data.OriginAddress) ?? "El comercio"}
            </span>
          </div>
          <div>
            <MapPin size={19} />
            <span>
              <small>Hasta</small>
              {addressLabel(data.DeliveryAddress) ?? "Tu domicilio"}
            </span>
          </div>
        </div>
        {destination && (
          <p className="buyer-shipment-map__route-note">
            {remaining.length > 1 || hasRoadRoute
              ? `Ruta vial en tiempo real · ${data.route_attribution ?? "Google Maps"}`
              : rider
                ? "Calculando trayecto vial..."
                : "Esperando inicio de recorrido del rider"}
          </p>
        )}
        <div className="buyer-shipment-map__rider">
          <div className="buyer-shipment-map__avatar">
            <Truck size={22} />
          </div>
          <div className="buyer-shipment-map__rider-info">
            <strong>{data.rider?.name || "Rider por asignar"}</strong>
            <span>
              {vehicleLabel(data.rider?.vehicle_type)}
              {data.rider?.plate_suffix
                ? ` · Patente •••${data.rider.plate_suffix.slice(-3)}`
                : ""}
            </span>
          </div>
          {riderId && currentUserId && (
            <button
              type="button"
              className="buyer-shipment-map__chat-button"
              onClick={() => setChatOpen(true)}
              aria-label="Enviar mensaje al rider"
              title="Enviar mensaje al rider"
            >
              <MessageCircle size={21} />
            </button>
          )}
        </div>
        {data.buyer_security_code && data.status !== "delivered" && (
          <p className="buyer-shipment-map__code">
            Código de entrega: <strong>{data.buyer_security_code}</strong>.
            Compartilo antes de recibir y revisar el paquete.
          </p>
        )}
      </div>
      {chatOpen && (
        <div
          className="buyer-shipment-map__chat"
          role="dialog"
          aria-label="Chat con el rider"
        >
          <div className="buyer-shipment-map__chat-heading">
            <strong>{data.rider?.name || "Rider"}</strong>
            <button
              type="button"
              onClick={() => setChatOpen(false)}
              aria-label="Cerrar chat"
            >
              <X size={20} />
            </button>
          </div>
          <div className="buyer-shipment-map__messages">
            {messagesError && <p>No se pudieron cargar los mensajes.</p>}
            {!messagesError && (messages?.data?.length ?? 0) === 0 && (
              <p>Escribile al rider sobre tu entrega.</p>
            )}
            {messages?.data?.map(
              (item: { id: string; sender_id: string; content: string }) => (
                <div
                  key={item.id}
                  className={`buyer-shipment-map__message ${item.sender_id === currentUserId ? "buyer-shipment-map__message--mine" : ""}`}
                >
                  {item.content}
                </div>
              ),
            )}
          </div>
          <form
            className="buyer-shipment-map__composer"
            onSubmit={(event) => {
              event.preventDefault();
              if (message.trim()) sendMessage.mutate(message.trim());
            }}
          >
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Escribí tu mensaje"
              aria-label="Mensaje para el rider"
            />
            <button
              type="submit"
              disabled={!message.trim() || sendMessage.isPending}
              aria-label="Enviar mensaje"
            >
              <Send size={18} />
            </button>
          </form>
          {sendMessage.isError && (
            <p className="buyer-shipment-map__chat-error">
              No se pudo enviar el mensaje.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function LoadedMap({
  center,
  origin,
  destination,
  rider,
  recorded,
  remaining,
  riderName,
  onHasRoadRoute,
}: {
  center: google.maps.LatLngLiteral;
  origin: google.maps.LatLngLiteral | null;
  destination: google.maps.LatLngLiteral | null;
  rider: google.maps.LatLngLiteral | null;
  recorded: google.maps.LatLngLiteral[];
  remaining: google.maps.LatLngLiteral[];
  riderName?: string | null;
  onHasRoadRoute?: (has: boolean) => void;
}) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "buyer-shipment-google-map",
    googleMapsApiKey: apiKey,
  });

  const [directionsPath, setDirectionsPath] = useState<
    google.maps.LatLngLiteral[]
  >([]);
  const lastRequestKeyRef = useRef<string>("");
  const mapRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (remaining.length >= 2) {
      setDirectionsPath([]);
      lastRequestKeyRef.current = "";
      onHasRoadRoute?.(true);
      return;
    }

    const start = rider || origin;
    if (!start || !destination) {
      onHasRoadRoute?.(false);
      return;
    }

    if (
      typeof window === "undefined" ||
      !window.google?.maps?.DirectionsService
    ) {
      return;
    }

    const reqKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}->${destination.lat.toFixed(4)},${destination.lng.toFixed(4)}`;
    if (lastRequestKeyRef.current === reqKey) {
      return;
    }
    lastRequestKeyRef.current = reqKey;

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: start,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (
          status === window.google.maps.DirectionsStatus.OK &&
          result?.routes?.[0]?.overview_path
        ) {
          const path = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          setDirectionsPath(path);
          onHasRoadRoute?.(true);
        } else {
          onHasRoadRoute?.(false);
        }
      },
    );
  }, [remaining.length, rider, origin, destination, onHasRoadRoute]);

  if (loadError)
    return (
      <div className="buyer-shipment-map__map-empty">Mapa no disponible</div>
    );
  if (!isLoaded)
    return <div className="buyer-shipment-map__map-empty">Cargando mapa…</div>;

  const brand =
    getComputedStyle(document.documentElement)
      .getPropertyValue("--brand-blue")
      .trim() || "#1d5fbf";

  const activeRemaining = remaining.length >= 2 ? remaining : directionsPath;

  const markerPoints = [origin, destination, rider].filter(
    (p): p is google.maps.LatLngLiteral => Boolean(p),
  );

  return (
    <GoogleMap
      mapContainerClassName="buyer-shipment-map__canvas"
      center={center}
      zoom={13}
      onLoad={(map) => {
        mapRef.current = map;
        if (markerPoints.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          markerPoints.forEach((p) => bounds.extend(p));
          map.fitBounds(bounds, 50);
        }
      }}
      options={{
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
        zoomControl: false,
      }}
    >
      {origin && (
        <MarkerF
          position={origin}
          title="Comercio"
          icon={
            typeof window !== "undefined" && window.google?.maps?.SymbolPath
              ? {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 7,
                  fillColor: "#d97706",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }
              : undefined
          }
        />
      )}
      {destination && (
        <MarkerF
          position={destination}
          title="Tu domicilio"
          icon={
            typeof window !== "undefined" && window.google?.maps?.SymbolPath
              ? {
                  path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                  scale: 6,
                  fillColor: "#e94823",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                }
              : undefined
          }
        />
      )}
      {rider && (
        <MarkerF
          position={rider}
          title={riderName || "Rider"}
          zIndex={10}
          icon={
            typeof window !== "undefined" && window.google?.maps?.Size
              ? {
                  url: "/Van.png",
                  scaledSize: new window.google.maps.Size(48, 39),
                  anchor: new window.google.maps.Point(24, 20),
                }
              : undefined
          }
        />
      )}
      {recorded.length > 1 && (
        <PolylineF
          path={recorded}
          options={{
            strokeColor: brand,
            strokeOpacity: 0.45,
            strokeWeight: 4,
          }}
        />
      )}
      {activeRemaining.length > 1 && (
        <PolylineF
          path={activeRemaining}
          options={{
            strokeColor: brand,
            strokeOpacity: 0.95,
            strokeWeight: 5,
          }}
        />
      )}
      {activeRemaining.length < 2 && rider && destination && (
        <PolylineF
          path={[rider, destination]}
          options={{
            strokeColor: brand,
            strokeOpacity: 0,
            icons: [
              {
                icon: {
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 2,
                  fillColor: brand,
                  fillOpacity: 1,
                  strokeOpacity: 0,
                },
                offset: "0",
                repeat: "12px",
              },
            ],
          }}
        />
      )}
    </GoogleMap>
  );
}
