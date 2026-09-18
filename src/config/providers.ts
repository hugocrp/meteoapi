import type { InjectionToken } from "tsyringe";
import type { GeocodingService } from "../services/GeocodingService.js";
import type { WeatherService } from "../services/WeatherService.js";
import { NominatimGeocodingService } from "../services/NominatimGeocodingService.js";
import { BanGeocodingService } from "../services/BanGeocodingService.js";
import { OpenMeteoWeatherService } from "../services/OpenMeteoWeatherService.js";
import { MetNorwayWeatherService } from "../services/MetNorwayWeatherService.js";

export const GEOCODING_PROVIDER_REGISTRY = {
  ban: BanGeocodingService,
  nominatim: NominatimGeocodingService,
} satisfies Record<string, InjectionToken<GeocodingService>>;

export const WEATHER_PROVIDER_REGISTRY = {
  "open-meteo": OpenMeteoWeatherService,
  "met-norway": MetNorwayWeatherService,
} satisfies Record<string, InjectionToken<WeatherService>>;

export type GeocodingProvider = keyof typeof GEOCODING_PROVIDER_REGISTRY;
export type WeatherProvider = keyof typeof WEATHER_PROVIDER_REGISTRY;

export function resolveGeocodingProvider(value: string): GeocodingProvider {
  if (!(value in GEOCODING_PROVIDER_REGISTRY)) {
    throw new Error(
      `GEOCODING_PROVIDER invalide : "${value}" (attendu : ${Object.keys(GEOCODING_PROVIDER_REGISTRY).join(" | ")})`,
    );
  }
  return value as GeocodingProvider;
}

export function resolveWeatherProvider(value: string): WeatherProvider {
  if (!(value in WEATHER_PROVIDER_REGISTRY)) {
    throw new Error(
      `WEATHER_PROVIDER invalide : "${value}" (attendu : ${Object.keys(WEATHER_PROVIDER_REGISTRY).join(" | ")})`,
    );
  }
  return value as WeatherProvider;
}
