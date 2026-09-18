import { describe, expect, it } from "vitest";
import type { Coordinates, WeatherVariable } from "../../src/domain/types.js";
import type { WeatherService } from "../../src/services/WeatherService.js";
import { FakeHttpClient } from "../fakes/FakeHttpClient.js";

const KNOWN_VARIABLES: WeatherVariable[] = [
  "temperature_2m",
  "relative_humidity_2m",
  "precipitation",
  "wind_speed_10m",
  "shortwave_radiation",
];

export interface WeatherServiceContractFixtures {
  createService: (httpClient: FakeHttpClient) => WeatherService;
  sampleResponse: unknown;
  coordinates: Coordinates;
  emptyResponse: unknown;
}

export function describeWeatherServiceContract(name: string, fixtures: WeatherServiceContractFixtures): void {
  describe(`Contrat WeatherService (${name})`, () => {
    it("coordonnées valides -> prévision alignée, sans champ propre au fournisseur", async () => {
      const httpClient = new FakeHttpClient(fixtures.sampleResponse);
      const service = fixtures.createService(httpClient);

      const forecast = await service.getHourlyForecast(fixtures.coordinates);

      expect(Object.keys(forecast).sort()).toEqual(["time", "variables"]);
      expect(forecast.time.length).toBeGreaterThan(0);
      for (const [variable, values] of Object.entries(forecast.variables)) {
        expect(KNOWN_VARIABLES).toContain(variable);
        expect(values).toHaveLength(forecast.time.length);
      }
    });

    it("réponse vide -> prévision vide, sans erreur", async () => {
      const httpClient = new FakeHttpClient(fixtures.emptyResponse);
      const service = fixtures.createService(httpClient);

      const forecast = await service.getHourlyForecast(fixtures.coordinates);

      expect(forecast.time).toEqual([]);
    });
  });
}
