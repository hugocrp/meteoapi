import { describe, expect, it } from "vitest";
import { resolveGeocodingProvider, resolveWeatherProvider } from "../../src/config/providers.js";

describe("resolveGeocodingProvider", () => {
  it("accepte une valeur connue", () => {
    expect(resolveGeocodingProvider("ban")).toBe("ban");
    expect(resolveGeocodingProvider("nominatim")).toBe("nominatim");
  });

  it("rejette une valeur inconnue", () => {
    expect(() => resolveGeocodingProvider("google")).toThrow();
  });
});

describe("resolveWeatherProvider", () => {
  it("accepte une valeur connue", () => {
    expect(resolveWeatherProvider("open-meteo")).toBe("open-meteo");
    expect(resolveWeatherProvider("met-norway")).toBe("met-norway");
  });

  it("rejette une valeur inconnue", () => {
    expect(() => resolveWeatherProvider("accuweather")).toThrow();
  });
});
