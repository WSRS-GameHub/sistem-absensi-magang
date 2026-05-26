export const OFFICE_LOCATION = {
  lat: Number(process.env.NEXT_PUBLIC_OFFICE_LAT ?? "-2.9824286241225053"),
  lng: Number(process.env.NEXT_PUBLIC_OFFICE_LNG ?? "104.72492517855642"),
  radius: Number(process.env.NEXT_PUBLIC_ABSENCE_RADIUS ?? "120"),
};