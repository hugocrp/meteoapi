import type { Request, Response } from "express";
import { AddressNotFoundError, UpstreamServiceError } from "../domain/types.js";
import type { ForecastService } from "../services/ForecastService.js";


export function createForecastHandler(forecastService: ForecastService) {
  return async (req: Request, res: Response): Promise<void> => {
    const address = req.query.address;

    if (typeof address !== "string" || address.trim().length === 0) {
      res.status(400).json({ error: "Le paramètre de requête 'address' est requis." });
      return;
    }

    try {
      const forecast = await forecastService.getForecastForAddress(address);
      res.status(200).json(forecast);
    } catch (error) {
      if (error instanceof AddressNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error instanceof UpstreamServiceError) {
        res.status(502).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: "Erreur interne inattendue." });
    }
  };
}
