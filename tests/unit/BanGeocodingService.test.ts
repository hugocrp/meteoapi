import { describe, expect, it } from "vitest";
import { BanGeocodingService } from "../../src/services/BanGeocodingService.js";
import { UpstreamServiceError } from "../../src/domain/types.js";
import { FakeHttpClient } from "../fakes/FakeHttpClient.js";

describe("BanGeocodingService", () => {
  it("convertit [lon, lat] GeoJSON en coordonnées", async () => {
    const httpClient = new FakeHttpClient({
      features: [{ geometry: { coordinates: [4.0852818, 44.1253665] } }],
    });
    const geocodingService = new BanGeocodingService(httpClient);

    const coordinates = await geocodingService.geocode("Alès");

    expect(coordinates).toEqual({ latitude: 44.1253665, longitude: 4.0852818 });
  });

  it("construit l'URL BAN attendue avec l'adresse encodée", async () => {
    const httpClient = new FakeHttpClient({ features: [{ geometry: { coordinates: [0, 0] } }] });
    const geocodingService = new BanGeocodingService(httpClient);

    await geocodingService.geocode("Saint-Étienne");

    expect(httpClient.requestedUrls[0]).toBe(
      "https://api-adresse.data.gouv.fr/search/?q=Saint-%C3%89tienne&limit=1",
    );
  });

  it("retourne null quand aucun résultat n'est trouvé", async () => {
    const httpClient = new FakeHttpClient({ features: [] });
    const geocodingService = new BanGeocodingService(httpClient);

    const coordinates = await geocodingService.geocode("Nulle part");

    expect(coordinates).toBeNull();
  });

  it("enveloppe une erreur réseau dans UpstreamServiceError", async () => {
    const httpClient = new FakeHttpClient();
    httpClient.failWith(new Error("timeout"));
    const geocodingService = new BanGeocodingService(httpClient);

    await expect(geocodingService.geocode("Alès")).rejects.toBeInstanceOf(UpstreamServiceError);
  });
});
