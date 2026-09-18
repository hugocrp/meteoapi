import "reflect-metadata";
import { container } from "tsyringe";
import { createApp } from "./app.js";
import { FetchHttpClient } from "./http/FetchHttpClient.js";
import { ForecastService } from "./services/ForecastService.js";
import { HTTP_CLIENT, GEOCODING_SERVICE, WEATHER_SERVICE, HTTP_USER_AGENT } from "./di/tokens.js";
import { loadEnvConfig } from "./config/env.js";
import {
  GEOCODING_PROVIDER_REGISTRY,
  WEATHER_PROVIDER_REGISTRY,
  resolveGeocodingProvider,
  resolveWeatherProvider,
} from "./config/providers.js";

const config = loadEnvConfig();

container.registerInstance(HTTP_USER_AGENT, config.httpUserAgent);
container.registerSingleton(HTTP_CLIENT, FetchHttpClient);

const geocodingProvider = resolveGeocodingProvider(config.geocodingProvider);
container.registerSingleton(GEOCODING_SERVICE, GEOCODING_PROVIDER_REGISTRY[geocodingProvider]);

const weatherProvider = resolveWeatherProvider(config.weatherProvider);
container.registerSingleton(WEATHER_SERVICE, WEATHER_PROVIDER_REGISTRY[weatherProvider]);

const forecastService = container.resolve(ForecastService);

const app = createApp(forecastService);

app.listen(config.port, () => {
  console.log(`API Météo à l'écoute sur http://localhost:${config.port}`);
  console.log(`Géocodage : ${geocodingProvider} | Météo : ${weatherProvider}`);
});
