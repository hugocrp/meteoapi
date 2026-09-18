import type { InjectionToken } from "tsyringe";
import type { HttpClient } from "../http/HttpClient.js";
import type { GeocodingService } from "../services/GeocodingService.js";
import type { WeatherService } from "../services/WeatherService.js";

/**
 * Jetons d'injection pour les dépendances typées par interface.
 * Une interface TypeScript n'existe plus à l'exécution (elle est effacée à
 * la compilation) : tsyringe ne peut donc pas deviner tout seul quelle
 * implémentation correspond à `HttpClient` ou `GeocodingService`. On lui
 * fournit un jeton explicite (Symbol), enregistré dans le composition root
 * (server.ts) et référencé par `@inject(...)` sur chaque paramètre de
 * constructeur qui en dépend.
 */
export const HTTP_CLIENT: InjectionToken<HttpClient> = Symbol("HttpClient");
export const GEOCODING_SERVICE: InjectionToken<GeocodingService> = Symbol("GeocodingService");
export const WEATHER_SERVICE: InjectionToken<WeatherService> = Symbol("WeatherService");
export const HTTP_USER_AGENT: InjectionToken<string> = Symbol("HttpUserAgent");
