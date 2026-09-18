import express, { type Express } from "express";
import { createForecastHandler } from "./controllers/forecastController.js";
import type { ForecastService } from "./services/ForecastService.js";

/**
 * Composition de l'application Express à partir d'un ForecastService déjà
 * assemblé. `app.ts` ne connaît aucune implémentation concrète (Nominatim,
 * Open-Meteo, fetch...) : c'est le rôle exclusif du composition root
 * (server.ts / tests). C'est ce qui rend l'app testable de bout en bout
 * avec de faux services, sans toucher au réseau.
 */
export function createApp(forecastService: ForecastService): Express {
  const app = express();

  app.get("/forecast", createForecastHandler(forecastService));

  return app;
}
