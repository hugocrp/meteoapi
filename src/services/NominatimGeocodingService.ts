import { inject, injectable } from "tsyringe";
import type { HttpClient } from "../http/HttpClient.js";
import type { Coordinates } from "../domain/types.js";
import { UpstreamServiceError } from "../domain/types.js";
import type { GeocodingService } from "./GeocodingService.js";
import { HTTP_CLIENT } from "../di/tokens.js";

interface NominatimResult {
  lat: string;
  lon: string;
}

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org/search";

/**
 * Implémentation du géocodage via Nominatim (OpenStreetMap).
 * Dépend uniquement de l'abstraction HttpClient : IoC, testable sans réseau.
 * @inject(HTTP_CLIENT) : httpClient est typé par une interface, effacée à la
 * compilation — tsyringe a besoin du jeton explicite pour savoir quoi
 * injecter (voir src/di/tokens.ts).
 */
@injectable()
export class NominatimGeocodingService implements GeocodingService {
  constructor(
    @inject(HTTP_CLIENT) private readonly httpClient: HttpClient,
    private readonly baseUrl: string = NOMINATIM_BASE_URL,
  ) {}

  async geocode(address: string): Promise<Coordinates | null> {
    const url = `${this.baseUrl}?q=${encodeURIComponent(address)}&format=json&limit=1`;

    let results: NominatimResult[];
    try {
      results = await this.httpClient.getJson<NominatimResult[]>(url);
    } catch (cause) {
      throw new UpstreamServiceError("Nominatim", cause);
    }

    const first = results[0];
    if (!first) {
      return null;
    }

    return {
      latitude: Number.parseFloat(first.lat),
      longitude: Number.parseFloat(first.lon),
    };
  }
}
