import { describe, expect, it } from "vitest";
import { ForecastService } from "../../src/services/ForecastService.js";
import { AddressNotFoundError, UpstreamServiceError } from "../../src/domain/types.js";
import { FakeGeocodingService } from "../fakes/FakeGeocodingService.js";
import { FakeWeatherService } from "../fakes/FakeWeatherService.js";

describe("ForecastService", () => {
  it("enchaîne géocodage puis météo et retourne la prévision", async () => {
    const geocoding = new FakeGeocodingService({ latitude: 44.13, longitude: 4.08 });
    const weather = new FakeWeatherService({
      time: ["2026-09-18T00:00"],
      variables: { temperature_2m: [18.4], shortwave_radiation: [0] },
    });
    const forecastService = new ForecastService(geocoding, weather);

    const forecast = await forecastService.getForecastForAddress("Alès");

    expect(forecast.address).toBe("Alès");
    expect(forecast.coordinates).toEqual({ latitude: 44.13, longitude: 4.08 });
    expect(forecast.hourly.time).toEqual(["2026-09-18T00:00"]);
    expect(forecast.hourly.variables.temperature_2m).toEqual([18.4]);
    expect(weather.lastRequestedCoordinates).toEqual({ latitude: 44.13, longitude: 4.08 });
  });

  it("lève AddressNotFoundError quand le géocodage ne trouve rien", async () => {
    const geocoding = new FakeGeocodingService(null);
    const weather = new FakeWeatherService();
    const forecastService = new ForecastService(geocoding, weather);

    await expect(forecastService.getForecastForAddress("Adresse inconnue")).rejects.toBeInstanceOf(
      AddressNotFoundError,
    );
  });

  it("ne contacte pas la météo si l'adresse n'est pas trouvée (couplage faible)", async () => {
    const geocoding = new FakeGeocodingService(null);
    const weather = new FakeWeatherService();
    const forecastService = new ForecastService(geocoding, weather);

    await expect(forecastService.getForecastForAddress("Adresse inconnue")).rejects.toThrow();

    expect(weather.lastRequestedCoordinates).toBeUndefined();
  });

  it("propage une erreur du service météo", async () => {
    const geocoding = new FakeGeocodingService({ latitude: 1, longitude: 1 });
    const weather = new FakeWeatherService();
    weather.failWith(new UpstreamServiceError("Open-Meteo"));
    const forecastService = new ForecastService(geocoding, weather);

    await expect(forecastService.getForecastForAddress("Alès")).rejects.toBeInstanceOf(
      UpstreamServiceError,
    );
  });
});
