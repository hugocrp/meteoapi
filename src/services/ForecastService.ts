import { inject, injectable } from "tsyringe";
import type { Forecast } from "../domain/types.js";
import { AddressNotFoundError } from "../domain/types.js";
import type { GeocodingService } from "./GeocodingService.js";
import type { WeatherService } from "./WeatherService.js";
import { GEOCODING_SERVICE, WEATHER_SERVICE } from "../di/tokens.js";

/**
 * Couche métier : enchaîne géocodage puis météo.
 * Ne dépend que d'abstractions (GeocodingService, WeatherService), reçues
 * par injection de dépendances — aucun `new` d'implémentation ici.
 * Résolue par tsyringe via `container.resolve(ForecastService)`.
 */
@injectable()
export class ForecastService {
  constructor(
    @inject(GEOCODING_SERVICE) private readonly geocodingService: GeocodingService,
    @inject(WEATHER_SERVICE) private readonly weatherService: WeatherService,
  ) {}

  async getForecastForAddress(address: string): Promise<Forecast> {
    const coordinates = await this.geocodingService.geocode(address);

    if (!coordinates) {
      throw new AddressNotFoundError(address);
    }

    const hourly = await this.weatherService.getHourlyForecast(coordinates);

    return { address, coordinates, hourly };
  }
}
