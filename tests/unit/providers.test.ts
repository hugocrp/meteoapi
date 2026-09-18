import { describe, expect, it } from "vitest";
import { ENV_DEFAULTS } from "../../src/config/env.js";
import {
  GEOCODING_PROVIDER_REGISTRY,
  WEATHER_PROVIDER_REGISTRY,
  resolveGeocodingProvider,
  resolveWeatherProvider,
} from "../../src/config/providers.js";

describe("resolveGeocodingProvider", () => {
  it.each(Object.keys(GEOCODING_PROVIDER_REGISTRY))("accepte le fournisseur enregistré %s", (name) => {
    expect(resolveGeocodingProvider(name)).toBe(name);
  });

  it("accepte le fournisseur par défaut de la config", () => {
    expect(() => resolveGeocodingProvider(ENV_DEFAULTS.GEOCODING_PROVIDER)).not.toThrow();
  });

  it("rejette une valeur inconnue", () => {
    expect(() => resolveGeocodingProvider("google")).toThrow();
  });
});

describe("resolveWeatherProvider", () => {
  it.each(Object.keys(WEATHER_PROVIDER_REGISTRY))("accepte le fournisseur enregistré %s", (name) => {
    expect(resolveWeatherProvider(name)).toBe(name);
  });

  it("accepte le fournisseur par défaut de la config", () => {
    expect(() => resolveWeatherProvider(ENV_DEFAULTS.WEATHER_PROVIDER)).not.toThrow();
  });

  it("rejette une valeur inconnue", () => {
    expect(() => resolveWeatherProvider("accuweather")).toThrow();
  });
});
