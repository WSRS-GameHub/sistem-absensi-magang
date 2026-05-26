"use client";

import { Circle, CircleMarker, MapContainer, TileLayer } from "react-leaflet";
import type { LatLngExpression } from "leaflet";

type OfficeMapProps = {
  lat: number;
  lng: number;
  radius: number;
};

export function OfficeMap({ lat, lng, radius }: OfficeMapProps) {
  const center: LatLngExpression = [lat, lng];

  return (
    <div className="h-[300px] w-full overflow-hidden rounded-3xl border bg-card shadow-sm">
      <MapContainer
        center={center}
        zoom={18}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Circle
          center={center}
          radius={radius}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#60a5fa",
            fillOpacity: 0.15,
          }}
        />

        <CircleMarker
          center={center}
          radius={8}
          pathOptions={{
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 1,
          }}
        />
      </MapContainer>
    </div>
  );
}