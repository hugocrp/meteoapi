import "reflect-metadata";
import { container } from "tsyringe";
import { createApp } from "./app.js";
import { FetchHttpClient } from "./http/FetchHttpClient.js";
import { ForecastService } from "./services/ForecastService.js";
import { CachingGeocodingService } from "./services/CachingGeocodingService.js";
import { DemoGeocodingService } from "./services/DemoGeocodingService.js";
import { DemoWeatherService } from "./services/DemoWeatherService.js";
import { InMemoryCache } from "./cache/InMemoryCache.js";
import {
  HTTP_CLIENT,
  GEOCODING_SERVICE,
  WEATHER_SERVICE,
  HTTP_USER_AGENT,
  UNCACHED_GEOCODING_SERVICE,
  GEOCODING_CACHE,
} from "./di/tokens.js";
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
container.registerSingleton(UNCACHED_GEOCODING_SERVICE, GEOCODING_PROVIDER_REGISTRY[geocodingProvider]);
container.registerSingleton(GEOCODING_CACHE, InMemoryCache);
container.registerSingleton(GEOCODING_SERVICE, CachingGeocodingService);

const weatherProvider = resolveWeatherProvider(config.weatherProvider);
container.registerSingleton(WEATHER_SERVICE, WEATHER_PROVIDER_REGISTRY[weatherProvider]);

const forecastService = container.resolve(ForecastService);

const demoContainer = container.createChildContainer();
demoContainer.registerSingleton(GEOCODING_SERVICE, DemoGeocodingService);
demoContainer.registerSingleton(WEATHER_SERVICE, DemoWeatherService);

const app = createApp(forecastService, demoContainer.resolve(ForecastService));

app.listen(config.port, () => {
  console.log(`API Météo à l'écoute sur http://localhost:${config.port}`);
  console.log(`Géocodage : ${geocodingProvider} | Météo : ${weatherProvider}`);
});
