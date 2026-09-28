import { describe, expect, it } from "vitest";
import type { Coordinates } from "../../src/domain/types.js";
import type { GeocodingService } from "../../src/services/GeocodingService.js";
import { FakeHttpClient } from "../fakes/FakeHttpClient.js";

export interface GeocodingServiceContractFixtures {
  createService: (httpClient: FakeHttpClient) => GeocodingService;
  foundResponse: unknown;
  foundCoordinates: Coordinates;
  notFoundResponse: unknown;
  emptyResponse: unknown;
  accentedAddress: string;
}

export function describeGeocodingServiceContract(name: string, fixtures: GeocodingServiceContractFixtures): void {
  describe(`Contrat GeocodingService (${name})`, () => {
    it("adresse valide -> coordonnées exactes, sans champ propre au fournisseur", async () => {
      const httpClient = new FakeHttpClient(fixtures.foundResponse);
      const service = fixtures.createService(httpClient);

      const result = await service.geocode("Alès");

      expect(result).toEqual(fixtures.foundCoordinates);
      expect(Object.keys(result ?? {}).sort()).toEqual(["latitude", "longitude"]);
    });

    it("adresse introuvable -> null", async () => {
      const httpClient = new FakeHttpClient(fixtures.notFoundResponse);
      const service = fixtures.createService(httpClient);

      await expect(service.geocode("Adresse totalement inconnue")).resolves.toBeNull();
    });

    it("réponse vide -> null, sans erreur", async () => {
      const httpClient = new FakeHttpClient(fixtures.emptyResponse);
      const service = fixtures.createService(httpClient);

      await expect(service.geocode("Nulle part")).resolves.toBeNull();
    });

    it("caractères accentués -> résolution correcte", async () => {
      const httpClient = new FakeHttpClient(fixtures.foundResponse);
      const service = fixtures.createService(httpClient);

      await expect(service.geocode(fixtures.accentedAddress)).resolves.toEqual(fixtures.foundCoordinates);
      expect(httpClient.requestedUrls[0]).not.toContain(fixtures.accentedAddress);
    });
  });
}
