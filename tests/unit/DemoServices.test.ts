import { describe, expect, it } from "vitest";
import { DemoGeocodingService } from "../../src/services/DemoGeocodingService.js";
import { DemoWeatherService } from "../../src/services/DemoWeatherService.js";

describe("DemoGeocodingService", () => {
  it("retourne des coordonnées simulées pour n'importe quelle adresse", async () => {
    const service = new DemoGeocodingService();

    expect(await service.geocode()).toEqual({ latitude: 44.1279, longitude: 4.0817 });
  });
});

describe("DemoWeatherService", () => {
  it("retourne 24 heures de températures alignées sur les horodatages", async () => {
    const forecast = await new DemoWeatherService().getHourlyForecast();

    expect(forecast.time).toHaveLength(24);
    expect(forecast.variables.temperature_2m).toHaveLength(24);
  });

  it("produit des horodatages ISO 8601 UTC", async () => {
    const forecast = await new DemoWeatherService().getHourlyForecast();

    for (const time of forecast.time) {
      expect(time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    }
  });

  it("est déterministe", async () => {
    const service = new DemoWeatherService();

    expect(await service.getHourlyForecast()).toEqual(await service.getHourlyForecast());
  });
});
