import { describe, expect, it } from "vitest";
import { loadEnvConfig, ENV_DEFAULTS } from "../../src/config/env.js";

describe("loadEnvConfig", () => {
  it("applique les valeurs par défaut quand rien n'est défini", () => {
    expect(loadEnvConfig({})).toEqual({
      port: Number(ENV_DEFAULTS.PORT),
      httpUserAgent: ENV_DEFAULTS.HTTP_USER_AGENT,
      geocodingProvider: ENV_DEFAULTS.GEOCODING_PROVIDER,
      weatherProvider: ENV_DEFAULTS.WEATHER_PROVIDER,
    });
  });

  it("lit chaque variable quand elle est définie", () => {
    const config = loadEnvConfig({
      PORT: "8080",
      HTTP_USER_AGENT: "MeteoApi/1.0 test@ecole.fr",
      GEOCODING_PROVIDER: "fournisseur-geo",
      WEATHER_PROVIDER: "fournisseur-meteo",
    });

    expect(config).toEqual({
      port: 8080,
      httpUserAgent: "MeteoApi/1.0 test@ecole.fr",
      geocodingProvider: "fournisseur-geo",
      weatherProvider: "fournisseur-meteo",
    });
  });
});
