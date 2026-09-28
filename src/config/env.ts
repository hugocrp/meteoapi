export interface EnvConfig {
  port: number;
  httpUserAgent: string;
  geocodingProvider: string;
  weatherProvider: string;
}

export const ENV_DEFAULTS = {
  PORT: "3000",
  HTTP_USER_AGENT: "TP2-MeteoApi/1.0 hugo.crepin@etu.mines-ales.fr",
  GEOCODING_PROVIDER: "ban",
  WEATHER_PROVIDER: "open-meteo",
} as const;

export function loadEnvConfig(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  return {
    port: Number.parseInt(env.PORT ?? ENV_DEFAULTS.PORT, 10),
    httpUserAgent: env.HTTP_USER_AGENT ?? ENV_DEFAULTS.HTTP_USER_AGENT,
    geocodingProvider: env.GEOCODING_PROVIDER ?? ENV_DEFAULTS.GEOCODING_PROVIDER,
    weatherProvider: env.WEATHER_PROVIDER ?? ENV_DEFAULTS.WEATHER_PROVIDER,
  };
}
