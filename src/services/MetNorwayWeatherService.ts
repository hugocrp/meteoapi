import { inject, injectable } from "tsyringe";
import type { HttpClient } from "../http/HttpClient.js";
import type { Coordinates, HourlyForecast } from "../domain/types.js";
import { UpstreamServiceError } from "../domain/types.js";
import type { WeatherService } from "./WeatherService.js";
import { HTTP_CLIENT } from "../di/tokens.js";

interface MetNorwayTimeserieEntry {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature?: number;
        relative_humidity?: number;
        wind_speed?: number;
      };
    };
  };
}

interface MetNorwayResponse {
  properties: {
    timeseries: MetNorwayTimeserieEntry[];
  };
}

const MET_NORWAY_BASE_URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact";

@injectable()
export class MetNorwayWeatherService implements WeatherService {
  constructor(@inject(HTTP_CLIENT) private readonly httpClient: HttpClient) {}

  async getHourlyForecast(coordinates: Coordinates): Promise<HourlyForecast> {
    const url = `${MET_NORWAY_BASE_URL}?lat=${coordinates.latitude}&lon=${coordinates.longitude}`;

    let response: MetNorwayResponse;
    try {
      response = await this.httpClient.getJson<MetNorwayResponse>(url);
    } catch (cause) {
      throw new UpstreamServiceError("MET Norway", cause);
    }

    const timeseries = response.properties?.timeseries ?? [];

    const time: string[] = [];
    const temperature: number[] = [];
    const relativeHumidity: number[] = [];
    const windSpeed: number[] = [];

    for (const entry of timeseries) {
      const details = entry.data.instant.details;
      time.push(entry.time);
      temperature.push(details.air_temperature ?? NaN);
      relativeHumidity.push(details.relative_humidity ?? NaN);
      windSpeed.push(details.wind_speed ?? NaN);
    }

    return {
      time,
      variables: {
        temperature_2m: temperature,
        relative_humidity_2m: relativeHumidity,
        wind_speed_10m: windSpeed,
      },
    };
  }
}
