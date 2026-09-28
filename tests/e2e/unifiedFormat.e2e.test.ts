import { container } from "tsyringe";
import type { Express } from "express";
import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { InMemoryCache } from "../../src/cache/InMemoryCache.js";
import {
  GEOCODING_PROVIDER_REGISTRY,
  WEATHER_PROVIDER_REGISTRY,
  type GeocodingProvider,
  type WeatherProvider,
} from "../../src/config/providers.js";
import {
  GEOCODING_CACHE,
  GEOCODING_SERVICE,
  HTTP_CLIENT,
  UNCACHED_GEOCODING_SERVICE,
  WEATHER_SERVICE,
} from "../../src/di/tokens.js";
import { CachingGeocodingService } from "../../src/services/CachingGeocodingService.js";
import { DemoGeocodingService } from "../../src/services/DemoGeocodingService.js";
import { DemoWeatherService } from "../../src/services/DemoWeatherService.js";
import { ForecastService } from "../../src/services/ForecastService.js";
import { RoutingFakeHttpClient, type FakeHttpRoute } from "../fakes/RoutingFakeHttpClient.js";

const geocodingRoutes: Record<GeocodingProvider, FakeHttpRoute> = {
  nominatim: {
    match: "nominatim.openstreetmap.org",
    response: [{ lat: "44.1253665", lon: "4.0852818" }],
  },
  ban: {
    match: "api-adresse.data.gouv.fr",
    response: { features: [{ geometry: { coordinates: [4.0852818, 44.1253665] } }] },
  },
};

const weatherRoutes: Record<WeatherProvider, FakeHttpRoute> = {
  "open-meteo": {
    match: "api.open-meteo.com",
    response: {
      hourly: {
        time: ["2026-09-18T00:00", "2026-09-18T01:00"],
        temperature_2m: [14.9, 14.8],
        relative_humidity_2m: [60, 61],
        precipitation: [0, 0],
        wind_speed_10m: [7.4, 8],
        shortwave_radiation: [0, 0],
      },
    },
  },
  "met-norway": {
    match: "api.met.no",
    response: {
      properties: {
        timeseries: [
          {
            time: "2026-09-18T00:00:00Z",
            data: { instant: { details: { air_temperature: 14.9, relative_humidity: 60, wind_speed: 7.4 } } },
          },
          {
            time: "2026-09-18T01:00:00Z",
            data: { instant: { details: { air_temperature: 14.8, relative_humidity: 61, wind_speed: 8 } } },
          },
        ],
      },
    },
  },
};

const geocodingProviders = Object.keys(GEOCODING_PROVIDER_REGISTRY) as GeocodingProvider[];
const weatherProviders = Object.keys(WEATHER_PROVIDER_REGISTRY) as WeatherProvider[];
const combinations = geocodingProviders.flatMap((geocoding) =>
  weatherProviders.map((weather) => [geocoding, weather] as const),
);

function buildApp(geocoding: GeocodingProvider, weather: WeatherProvider, httpClient: RoutingFakeHttpClient): Express {
  const liveContainer = container.createChildContainer();
  liveContainer.registerInstance(HTTP_CLIENT, httpClient);
  liveContainer.registerSingleton(UNCACHED_GEOCODING_SERVICE, GEOCODING_PROVIDER_REGISTRY[geocoding]);
  liveContainer.registerSingleton(GEOCODING_CACHE, InMemoryCache);
  liveContainer.registerSingleton(GEOCODING_SERVICE, CachingGeocodingService);
  liveContainer.registerSingleton(WEATHER_SERVICE, WEATHER_PROVIDER_REGISTRY[weather]);

  const demoContainer = liveContainer.createChildContainer();
  demoContainer.registerSingleton(GEOCODING_SERVICE, DemoGeocodingService);
  demoContainer.registerSingleton(WEATHER_SERVICE, DemoWeatherService);

  return createApp(liveContainer.resolve(ForecastService), demoContainer.resolve(ForecastService));
}

function expectUnifiedShape(body: Record<string, unknown>): void {
  expect(Object.keys(body).sort()).toEqual(["address", "hourly", "latitude", "longitude"]);
  expect(typeof body.address).toBe("string");
  expect(typeof body.latitude).toBe("number");
  expect(typeof body.longitude).toBe("number");

  const hourly = body.hourly as Array<Record<string, unknown>>;
  expect(Array.isArray(hourly)).toBe(true);
  expect(hourly.length).toBeGreaterThan(0);
  for (const entry of hourly) {
    expect(Object.keys(entry).sort()).toEqual(["temperatureCelsius", "time"]);
    expect(entry.time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    expect(typeof entry.temperatureCelsius).toBe("number");
  }
}

describe.each(combinations)("Format de sortie unifié (%s + %s)", (geocoding, weather) => {
  it("respecte exactement la structure attendue", async () => {
    const httpClient = new RoutingFakeHttpClient([geocodingRoutes[geocoding], weatherRoutes[weather]]);

    const response = await request(buildApp(geocoding, weather, httpClient)).get("/forecast").query({ address: "Alès" });

    expect(response.status).toBe(200);
    expectUnifiedShape(response.body);
  });

  it("ne géocode qu'une seule fois pour deux appels sur la même adresse", async () => {
    const httpClient = new RoutingFakeHttpClient([geocodingRoutes[geocoding], weatherRoutes[weather]]);
    const app = buildApp(geocoding, weather, httpClient);

    await request(app).get("/forecast").query({ address: "Alès" });
    await request(app).get("/forecast").query({ address: "Alès" });

    expect(httpClient.countRequests(geocodingRoutes[geocoding].match)).toBe(1);
    expect(httpClient.countRequests(weatherRoutes[weather].match)).toBe(2);
  });

  it("en mode démo, garde la même structure sans aucun appel réseau", async () => {
    const httpClient = new RoutingFakeHttpClient([geocodingRoutes[geocoding], weatherRoutes[weather]]);

    const response = await request(buildApp(geocoding, weather, httpClient))
      .get("/forecast")
      .query({ address: "Alès", demo: "true" });

    expect(response.status).toBe(200);
    expectUnifiedShape(response.body);
    expect(httpClient.requestedUrls).toEqual([]);
  });
});

describe("Format de sortie unifié : indépendance vis-à-vis du fournisseur", () => {
  it("renvoie exactement la même réponse pour les mêmes données amont, quel que soit le fournisseur", async () => {
    const bodies: unknown[] = [];

    for (const [geocoding, weather] of combinations) {
      const httpClient = new RoutingFakeHttpClient([geocodingRoutes[geocoding], weatherRoutes[weather]]);
      const response = await request(buildApp(geocoding, weather, httpClient)).get("/forecast").query({ address: "Alès" });
      bodies.push(response.body);
    }

    for (const body of bodies) {
      expect(body).toEqual(bodies[0]);
    }
  });
});
