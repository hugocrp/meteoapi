import { describe, expect, it } from "vitest";
import { loadEnvConfig, ENV_DEFAULTS } from "../../src/config/env.js";

describe("loadEnvConfig", () => {
  it("applique les valeurs par défaut quand rien n'est défini", () => {
    expect(loadEnvConfig({})).toEqual({
      port: 3000,
      httpUserAgent: ENV_DEFAULTS.HTTP_USER_AGENT,
      geocodingProvider: "ban",
      weatherProvider: "open-meteo",
    });
  });

  it("lit chaque variable quand elle est définie", () => {
    const config = loadEnvConfig({
      PORT: "8080",
      HTTP_USER_AGENT: "TP2-MeteoApi/1.0 test@ecole.fr",
      GEOCODING_PROVIDER: "nominatim",
      WEATHER_PROVIDER: "met-norway",
    });

    expect(config).toEqual({
      port: 8080,
      httpUserAgent: "TP2-MeteoApi/1.0 test@ecole.fr",
      geocodingProvider: "nominatim",
      weatherProvider: "met-norway",
    });
  });
});
