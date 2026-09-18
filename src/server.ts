import "reflect-metadata";
import { container } from "tsyringe";
import { createApp } from "./app.js";
import { FetchHttpClient } from "./http/FetchHttpClient.js";
import { NominatimGeocodingService } from "./services/NominatimGeocodingService.js";
import { OpenMeteoWeatherService } from "./services/OpenMeteoWeatherService.js";
import { ForecastService } from "./services/ForecastService.js";
import { HTTP_CLIENT, GEOCODING_SERVICE, WEATHER_SERVICE } from "./di/tokens.js";

/**
 * Composition root : on enregistre chaque abstraction (jeton) auprès de son
 * implémentation concrète. tsyringe résout ensuite tout le graphe — plus de
 * `new` manuel en cascade. C'est le "conteneur IoC" décrit dans le cours,
 * ici une vraie librairie plutôt qu'écrit à la main.
 *
 * NominatimGeocodingService et OpenMeteoWeatherService prennent un
 * paramètre de config (baseUrl/variables) en plus de leur dépendance :
 * tsyringe ne peut pas deviner une valeur par défaut pour un paramètre non
 * injecté, donc on les enregistre via `useFactory`, qui appelle `c.resolve`
 * pour la seule vraie dépendance (HttpClient) et laisse le reste par défaut.
 * `useFactory` ne met pas en cache l'instance créée (contrairement à
 * `registerSingleton`) : on le fait nous-mêmes pour garder une seule
 * instance par service, comme le reste de l'application.
 */
container.registerSingleton(HTTP_CLIENT, FetchHttpClient);

let geocodingServiceInstance: NominatimGeocodingService | undefined;
container.register(GEOCODING_SERVICE, {
  useFactory: (c) => (geocodingServiceInstance ??= new NominatimGeocodingService(c.resolve(HTTP_CLIENT))),
});

let weatherServiceInstance: OpenMeteoWeatherService | undefined;
container.register(WEATHER_SERVICE, {
  useFactory: (c) => (weatherServiceInstance ??= new OpenMeteoWeatherService(c.resolve(HTTP_CLIENT))),
});

const forecastService = container.resolve(ForecastService);

const app = createApp(forecastService);

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

app.listen(port, () => {
  console.log(`API Météo à l'écoute sur http://localhost:${port}`);
  console.log(`Exemple : http://localhost:${port}/forecast?address=Alès`);
});
