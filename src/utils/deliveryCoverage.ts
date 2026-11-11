type Location = {
  latitude?: number | null;
  longitude?: number | null;
};

type DeliveryOrigin = Location & {
  delivery_radius_km?: number | null;
};

export type DeliveryCoverage =
  | { status: "unknown" }
  | { status: "outside"; distanceKm?: number; radiusKm?: number }
  | { status: "inside"; distanceKm: number; radiusKm: number };

export function getDeliveryCoverage(
  origin?: DeliveryOrigin | null,
  destination?: Location | null,
): DeliveryCoverage {
  if (!origin || !destination ||
      origin.latitude == null || origin.longitude == null ||
      destination.latitude == null || destination.longitude == null) {
    return { status: "unknown" };
  }

  const [originLat, originLng, destinationLat, destinationLng] = [
    origin.latitude, origin.longitude, destination.latitude, destination.longitude,
  ].map(Number);
  if (![originLat, originLng, destinationLat, destinationLng].every(Number.isFinite)) {
    return { status: "unknown" };
  }

  const radiusKm = Number(origin.delivery_radius_km);
  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    return { status: "outside" };
  }

  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDifference = toRadians(destinationLat - originLat);
  const longitudeDifference = toRadians(destinationLng - originLng);
  const a = Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(originLat)) * Math.cos(toRadians(destinationLat)) *
    Math.sin(longitudeDifference / 2) ** 2;
  // Match the API's minimum and rounding before comparing with the branch radius.
  const distanceKm = Math.max(1, Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 10) / 10);

  return distanceKm <= radiusKm
    ? { status: "inside", distanceKm, radiusKm }
    : { status: "outside", distanceKm, radiusKm };
}
