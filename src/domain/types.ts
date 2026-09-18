export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Variables horaires supportées par Open-Meteo qu'on choisit d'exposer.
 * Ajouter une variable = ajouter une ligne ici + dans WEATHER_VARIABLES
 * (OpenMeteoWeatherService.ts). Rien d'autre ne change : ni ForecastService,
 * ni le contrôleur, ni la forme de la réponse HTTP (toujours un dictionnaire).
 */
export type WeatherVariable =
  | "temperature_2m"
  | "relative_humidity_2m"
  | "precipitation"
  | "wind_speed_10m"
  | "shortwave_radiation";

export interface HourlyForecast {
  time: string[];
  /** Une entrée par variable demandée, alignée sur `time` (même index). */
  variables: Partial<Record<WeatherVariable, number[]>>;
}

export interface Forecast {
  address: string;
  coordinates: Coordinates;
  hourly: HourlyForecast;
}

export class AddressNotFoundError extends Error {
  constructor(address: string) {
    super(`Aucune coordonnee trouvee pour l'adresse "${address}"`);
    this.name = "AddressNotFoundError";
  }
}

export class UpstreamServiceError extends Error {
  constructor(service: string, cause?: unknown) {
    super(`Le service externe "${service}" est indisponible ou a repondu une erreur`);
    this.name = "UpstreamServiceError";
    this.cause = cause;
  }
}
