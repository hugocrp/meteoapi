import { inject, injectable } from "tsyringe";
import type { HttpClient } from "../http/HttpClient.js";
import type { Coordinates } from "../domain/types.js";
import { UpstreamServiceError } from "../domain/types.js";
import type { GeocodingService } from "./GeocodingService.js";
import { HTTP_CLIENT } from "../di/tokens.js";

interface BanFeature {
  geometry: {
    coordinates: [number, number];
  };
}

interface BanResponse {
  features: BanFeature[];
}

const BAN_BASE_URL = "https://api-adresse.data.gouv.fr/search/";

@injectable()
export class BanGeocodingService implements GeocodingService {
  constructor(@inject(HTTP_CLIENT) private readonly httpClient: HttpClient) {}

  async geocode(address: string): Promise<Coordinates | null> {
    const url = `${BAN_BASE_URL}?q=${encodeURIComponent(address)}&limit=1`;

    let response: BanResponse;
    try {
      response = await this.httpClient.getJson<BanResponse>(url);
    } catch (cause) {
      throw new UpstreamServiceError("BAN", cause);
    }

    const first = response.features[0];
    if (!first) {
      return null;
    }

    const [longitude, latitude] = first.geometry.coordinates;
    return { latitude, longitude };
  }
}
