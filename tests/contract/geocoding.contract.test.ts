import { NominatimGeocodingService } from "../../src/services/NominatimGeocodingService.js";
import { BanGeocodingService } from "../../src/services/BanGeocodingService.js";
import { describeGeocodingServiceContract } from "./geocodingServiceContract.js";

describeGeocodingServiceContract("Nominatim", {
  createService: (httpClient) => new NominatimGeocodingService(httpClient),
  foundResponse: [{ lat: "44.1253665", lon: "4.0852818" }],
  foundCoordinates: { latitude: 44.1253665, longitude: 4.0852818 },
  notFoundResponse: [],
  emptyResponse: [],
  accentedAddress: "Saint-Étienne",
});

describeGeocodingServiceContract("BAN", {
  createService: (httpClient) => new BanGeocodingService(httpClient),
  foundResponse: {
    features: [{ geometry: { coordinates: [4.0852818, 44.1253665] } }],
  },
  foundCoordinates: { latitude: 44.1253665, longitude: 4.0852818 },
  notFoundResponse: { features: [] },
  emptyResponse: { features: [] },
  accentedAddress: "Saint-Étienne",
});
