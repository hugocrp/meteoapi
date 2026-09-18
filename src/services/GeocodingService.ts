import type { Coordinates } from "../domain/types.js";

export interface GeocodingService {
  geocode(address: string): Promise<Coordinates | null>;
}
