import { injectable } from "tsyringe";
import type { Coordinates } from "../domain/types.js";
import type { GeocodingService } from "./GeocodingService.js";

@injectable()
export class DemoGeocodingService implements GeocodingService {
  async geocode(): Promise<Coordinates | null> {
    return { latitude: 44.1279, longitude: 4.0817 };
  }
}
