"use client";

import dynamic from "next/dynamic";

const OfficeMap = dynamic(
  () => import("./office-map").then((mod) => mod.OfficeMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] w-full animate-pulse rounded-3xl border bg-muted/30" />
    ),
  }
);

type OfficeMapWrapperProps = {
  lat: number;
  lng: number;
  radius: number;
};

export function OfficeMapWrapper({
  lat,
  lng,
  radius,
}: OfficeMapWrapperProps) {
  return <OfficeMap lat={lat} lng={lng} radius={radius} />;
}