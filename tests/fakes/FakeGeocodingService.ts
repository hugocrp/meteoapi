import type { Coordinates } from "../../src/domain/types.js";
import type { GeocodingService } from "../../src/services/GeocodingService.js";

export class FakeGeocodingService implements GeocodingService {
  public lastRequestedAddress: string | undefined;
  private error: Error | undefined;

  constructor(private coordinates: Coordinates | null = null) {}

  respondWith(coordinates: Coordinates | null): void {
    this.coordinates = coordinates;
    this.error = undefined;
  }

  failWith(error: Error): void {
    this.error = error;
  }

  async geocode(address: string): Promise<Coordinates | null> {
    this.lastRequestedAddress = address;
    if (this.error) {
      throw this.error;
    }
    return this.coordinates;
  }
}
