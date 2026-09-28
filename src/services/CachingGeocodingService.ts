import { inject, injectable } from "tsyringe";
import type { Cache } from "../cache/Cache.js";
import type { Coordinates } from "../domain/types.js";
import type { GeocodingService } from "./GeocodingService.js";
import { GEOCODING_CACHE, UNCACHED_GEOCODING_SERVICE } from "../di/tokens.js";

@injectable()
export class CachingGeocodingService implements GeocodingService {
  constructor(
    @inject(UNCACHED_GEOCODING_SERVICE) private readonly geocodingService: GeocodingService,
    @inject(GEOCODING_CACHE) private readonly cache: Cache<string, Coordinates | null>,
  ) {}

  async geocode(address: string): Promise<Coordinates | null> {
    const key = address.trim().toLowerCase().replace(/\s+/g, " ");

    const cached = await this.cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const coordinates = await this.geocodingService.geocode(address);
    await this.cache.set(key, coordinates);
    return coordinates;
  }
}
