"use client";

import dynamic from "next/dynamic";
import type { MapPickerModalProps } from "./MapPickerModalClient";

// Leaflet accesses window when imported, so load the implementation only in the browser.
const MapPickerModalClient = dynamic<MapPickerModalProps>(
  () => import("./MapPickerModalClient"),
  { ssr: false },
);

export default function MapPickerModal(props: MapPickerModalProps) {
  if (!props.isOpen) return null;
  return <MapPickerModalClient {...props} />;
}
