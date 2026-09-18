import { describe, expect, it } from "vitest";
import { OpenMeteoWeatherService } from "../../src/services/OpenMeteoWeatherService.js";
import { UpstreamServiceError } from "../../src/domain/types.js";
import { FakeHttpClient } from "../fakes/FakeHttpClient.js";

describe("OpenMeteoWeatherService", () => {
  it("convertit la réponse Open-Meteo en prévision horaire avec plusieurs variables", async () => {
    const httpClient = new FakeHttpClient({
      hourly: {
        time: ["2026-09-18T00:00", "2026-09-18T01:00"],
        temperature_2m: [18.4, 17.9],
        shortwave_radiation: [0, 0],
      },
    });
    const weatherService = new OpenMeteoWeatherService(httpClient);

    const forecast = await weatherService.getHourlyForecast({ latitude: 48.85, longitude: 2.35 });

    expect(forecast).toEqual({
      time: ["2026-09-18T00:00", "2026-09-18T01:00"],
      variables: {
        temperature_2m: [18.4, 17.9],
        shortwave_radiation: [0, 0],
      },
    });
  });

  it("demande la liste de variables par défaut dans l'URL", async () => {
    const httpClient = new FakeHttpClient({ hourly: { time: [] } });
    const weatherService = new OpenMeteoWeatherService(httpClient);

    await weatherService.getHourlyForecast({ latitude: 48.85, longitude: 2.35 });

    expect(httpClient.requestedUrls[0]).toBe(
      "https://api.open-meteo.com/v1/forecast?latitude=48.85&longitude=2.35" +
        "&hourly=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,shortwave_radiation",
    );
  });

  it("enveloppe une erreur réseau dans UpstreamServiceError", async () => {
    const httpClient = new FakeHttpClient();
    httpClient.failWith(new Error("timeout"));
    const weatherService = new OpenMeteoWeatherService(httpClient);

    await expect(weatherService.getHourlyForecast({ latitude: 0, longitude: 0 })).rejects.toBeInstanceOf(
      UpstreamServiceError,
    );
  });
});
