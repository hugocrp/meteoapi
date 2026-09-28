import type { Forecast } from "../domain/types.js";

export interface HourlyForecastEntryResponse {
  time: string;
  temperatureCelsius: number | null;
}

export interface ForecastResponse {
  address: string;
  latitude: number;
  longitude: number;
  hourly: HourlyForecastEntryResponse[];
}

export function toForecastResponse(forecast: Forecast): ForecastResponse {
  const temperatures = forecast.hourly.variables.temperature_2m ?? [];

  return {
    address: forecast.address,
    latitude: forecast.coordinates.latitude,
    longitude: forecast.coordinates.longitude,
    hourly: forecast.hourly.time.map((time, index) => ({
      time,
      temperatureCelsius: temperatures[index] ?? null,
    })),
  };
}
