import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { ForecastService } from "../../src/services/ForecastService.js";
import { UpstreamServiceError } from "../../src/domain/types.js";
import { FakeGeocodingService } from "../fakes/FakeGeocodingService.js";
import { FakeWeatherService } from "../fakes/FakeWeatherService.js";

/**
 * Test de bout en bout : requête HTTP réelle -> routeur Express ->
 * contrôleur -> ForecastService -> réponse HTTP. Seule la frontière réseau
 * externe (Nominatim / Open-Meteo) est remplacée par des fakes, grâce à la
 * DI mise en place dans app.ts : aucune modification du code de production
 * n'est nécessaire pour tester toute la chaîne interne.
 */
describe("GET /forecast (e2e)", () => {
  it("retourne 200 et la prévision pour une adresse valide", async () => {
    const geocoding = new FakeGeocodingService({ latitude: 44.13, longitude: 4.08 });
    const weather = new FakeWeatherService({
      time: ["2026-09-18T00:00"],
      variables: { temperature_2m: [18.4], shortwave_radiation: [12.5] },
    });
    const app = createApp(new ForecastService(geocoding, weather));

    const response = await request(app).get("/forecast").query({ address: "Alès" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      address: "Alès",
      coordinates: { latitude: 44.13, longitude: 4.08 },
      hourly: {
        time: ["2026-09-18T00:00"],
        variables: { temperature_2m: [18.4], shortwave_radiation: [12.5] },
      },
    });
  });

  it("retourne 400 quand le paramètre address est absent", async () => {
    const app = createApp(
      new ForecastService(new FakeGeocodingService(), new FakeWeatherService()),
    );

    const response = await request(app).get("/forecast");

    expect(response.status).toBe(400);
  });

  it("retourne 404 quand l'adresse ne peut pas être géocodée", async () => {
    const geocoding = new FakeGeocodingService(null);
    const app = createApp(new ForecastService(geocoding, new FakeWeatherService()));

    const response = await request(app).get("/forecast").query({ address: "Nulle part" });

    expect(response.status).toBe(404);
  });

  it("retourne 502 quand un service externe échoue", async () => {
    const geocoding = new FakeGeocodingService({ latitude: 0, longitude: 0 });
    const weather = new FakeWeatherService();
    weather.failWith(new UpstreamServiceError("Open-Meteo"));
    const app = createApp(new ForecastService(geocoding, weather));

    const response = await request(app).get("/forecast").query({ address: "Alès" });

    expect(response.status).toBe(502);
  });
});
