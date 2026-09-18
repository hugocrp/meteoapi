import { describe, expect, it } from "vitest";
import { NominatimGeocodingService } from "../../src/services/NominatimGeocodingService.js";
import { UpstreamServiceError } from "../../src/domain/types.js";
import { FakeHttpClient } from "../fakes/FakeHttpClient.js";

describe("NominatimGeocodingService", () => {
  it("convertit la première réponse Nominatim en coordonnées", async () => {
    const httpClient = new FakeHttpClient([{ lat: "44.1279", lon: "4.0817" }]);
    const geocodingService = new NominatimGeocodingService(httpClient);

    const coordinates = await geocodingService.geocode("Alès");

    expect(coordinates).toEqual({ latitude: 44.1279, longitude: 4.0817 });
  });

  it("construit l'URL Nominatim attendue avec l'adresse encodée", async () => {
    const httpClient = new FakeHttpClient([{ lat: "0", lon: "0" }]);
    const geocodingService = new NominatimGeocodingService(httpClient);

    await geocodingService.geocode("Saint-Étienne");

    expect(httpClient.requestedUrls[0]).toBe(
      "https://nominatim.openstreetmap.org/search?q=Saint-%C3%89tienne&format=json&limit=1",
    );
  });

  it("retourne null quand aucun résultat n'est trouvé", async () => {
    const httpClient = new FakeHttpClient([]);
    const geocodingService = new NominatimGeocodingService(httpClient);

    const coordinates = await geocodingService.geocode("Nulle part");

    expect(coordinates).toBeNull();
  });

  it("enveloppe une erreur réseau dans UpstreamServiceError", async () => {
    const httpClient = new FakeHttpClient();
    httpClient.failWith(new Error("timeout"));
    const geocodingService = new NominatimGeocodingService(httpClient);

    await expect(geocodingService.geocode("Alès")).rejects.toBeInstanceOf(UpstreamServiceError);
  });
});
