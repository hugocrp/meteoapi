import { inject, injectable } from "tsyringe";
import type { HttpClient } from "../http/HttpClient.js";
import type { Coordinates, HourlyForecast, WeatherVariable } from "../domain/types.js";
import { UpstreamServiceError } from "../domain/types.js";
import type { WeatherService } from "./WeatherService.js";
import { HTTP_CLIENT } from "../di/tokens.js";

interface OpenMeteoResponse {
  // La clé "time" et une clé par variable demandée, ex. "temperature_2m".
  hourly: Record<string, string[] | number[]>;
}

const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";

/**
 * Variables demandées par défaut à Open-Meteo. C'est la seule liste à
 * modifier pour exposer une nouvelle info météo (ex. "cloud_cover") :
 * ni le type HourlyForecast, ni ForecastService, ni le contrôleur n'ont
 * besoin de changer.
 */
export const WEATHER_VARIABLES: WeatherVariable[] = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "wind_speed_10m",
  "shortwave_radiation",
];

/**
 * Implémentation des prévisions via Open-Meteo.
 * Dépend uniquement de l'abstraction HttpClient : IoC, testable sans réseau.
 * La liste de variables demandées est reçue en config (constructeur), pas
 * codée en dur dans la méthode : on peut la faire varier sans changer cette
 * classe. @inject(HTTP_CLIENT) : voir NominatimGeocodingService pour la
 * raison du jeton explicite (interface effacée à la compilation).
 */
@injectable()
export class OpenMeteoWeatherService implements WeatherService {
  constructor(
    @inject(HTTP_CLIENT) private readonly httpClient: HttpClient,
    private readonly variables: WeatherVariable[] = WEATHER_VARIABLES,
    private readonly baseUrl: string = OPEN_METEO_BASE_URL,
  ) {}

  async getHourlyForecast(coordinates: Coordinates): Promise<HourlyForecast> {
    const url =
      `${this.baseUrl}?latitude=${coordinates.latitude}` +
      `&longitude=${coordinates.longitude}&hourly=${this.variables.join(",")}`;

    let response: OpenMeteoResponse;
    try {
      response = await this.httpClient.getJson<OpenMeteoResponse>(url);
    } catch (cause) {
      throw new UpstreamServiceError("Open-Meteo", cause);
    }

    const { time, ...variableValues } = response.hourly;

    return {
      time: time as string[],
      variables: variableValues as Partial<Record<WeatherVariable, number[]>>,
    };
  }
}
