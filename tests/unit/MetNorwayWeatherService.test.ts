import { describe, expect, it } from "vitest";
import { MetNorwayWeatherService } from "../../src/services/MetNorwayWeatherService.js";
import { UpstreamServiceError } from "../../src/domain/types.js";
import { FakeHttpClient } from "../fakes/FakeHttpClient.js";

describe("MetNorwayWeatherService", () => {
  it("convertit les timeseries en prévision horaire", async () => {
    const httpClient = new FakeHttpClient({
      properties: {
        timeseries: [
          {
            time: "2026-09-18T00:00:00Z",
            data: { instant: { details: { air_temperature: 14.9, relative_humidity: 60, wind_speed: 7.4 } } },
          },
        ],
      },
    });
    const weatherService = new MetNorwayWeatherService(httpClient);

    const forecast = await weatherService.getHourlyForecast({ latitude: 44.13, longitude: 4.08 });

    expect(forecast).toEqual({
      time: ["2026-09-18T00:00:00Z"],
      variables: {
        temperature_2m: [14.9],
        relative_humidity_2m: [60],
        wind_speed_10m: [7.4],
      },
    });
  });

  it("construit l'URL MET Norway attendue avec lat/lon", async () => {
    const httpClient = new FakeHttpClient({ properties: { timeseries: [] } });
    const weatherService = new MetNorwayWeatherService(httpClient);

    await weatherService.getHourlyForecast({ latitude: 44.13, longitude: 4.08 });

    expect(httpClient.requestedUrls[0]).toBe(
      "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=44.13&lon=4.08",
    );
  });

  it("enveloppe une erreur réseau dans UpstreamServiceError", async () => {
    const httpClient = new FakeHttpClient();
    httpClient.failWith(new Error("timeout"));
    const weatherService = new MetNorwayWeatherService(httpClient);

    await expect(weatherService.getHourlyForecast({ latitude: 0, longitude: 0 })).rejects.toBeInstanceOf(
      UpstreamServiceError,
    );
  });
});
