import { describe, expect, it, vi } from "vitest";
import type { Cache } from "../../src/cache/Cache.js";
import { InMemoryCache } from "../../src/cache/InMemoryCache.js";
import type { Coordinates } from "../../src/domain/types.js";
import { UpstreamServiceError } from "../../src/domain/types.js";
import { CachingGeocodingService } from "../../src/services/CachingGeocodingService.js";
import type { GeocodingService } from "../../src/services/GeocodingService.js";

const ALES: Coordinates = { latitude: 44.1279, longitude: 4.0817 };

function createCachingService(geocode: GeocodingService["geocode"]) {
  const cache = new InMemoryCache<string, Coordinates | null>();
  return new CachingGeocodingService({ geocode }, cache);
}

describe("CachingGeocodingService", () => {
  it("n'appelle le service sous-jacent qu'une fois pour la même adresse", async () => {
    const geocode = vi.fn(async () => ALES);
    const service = createCachingService(geocode);

    const first = await service.geocode("Alès");
    const second = await service.geocode("Alès");

    expect(first).toEqual(ALES);
    expect(second).toEqual(ALES);
    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it("considère la même adresse malgré la casse et les espaces", async () => {
    const geocode = vi.fn(async () => ALES);
    const service = createCachingService(geocode);

    await service.geocode("Alès");
    await service.geocode("  alès ");
    await service.geocode("ALÈS");

    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it("normalise les espaces multiples à l'intérieur de l'adresse", async () => {
    const geocode = vi.fn(async () => ALES);
    const service = createCachingService(geocode);

    await service.geocode("12 rue  de la Paix");
    await service.geocode("12 rue de la paix");

    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it("appelle le service sous-jacent pour chaque adresse différente", async () => {
    const geocode = vi.fn(async () => ALES);
    const service = createCachingService(geocode);

    await service.geocode("Alès");
    await service.geocode("Nîmes");

    expect(geocode).toHaveBeenCalledTimes(2);
  });

  it("met aussi en cache une adresse introuvable", async () => {
    const geocode = vi.fn(async () => null);
    const service = createCachingService(geocode);

    expect(await service.geocode("Nulle part")).toBeNull();
    expect(await service.geocode("Nulle part")).toBeNull();
    expect(geocode).toHaveBeenCalledTimes(1);
  });

  it("ne met pas en cache une erreur du service sous-jacent", async () => {
    const geocode = vi
      .fn<GeocodingService["geocode"]>()
      .mockRejectedValueOnce(new UpstreamServiceError("BAN"))
      .mockResolvedValueOnce(ALES);
    const service = createCachingService(geocode);

    await expect(service.geocode("Alès")).rejects.toBeInstanceOf(UpstreamServiceError);
    await expect(service.geocode("Alès")).resolves.toEqual(ALES);
    expect(geocode).toHaveBeenCalledTimes(2);
  });

  it("délègue le stockage à l'abstraction Cache qui lui est fournie", async () => {
    const geocode = vi.fn(async () => ALES);
    const cache: Cache<string, Coordinates | null> = {
      get: vi.fn(async () => ({ latitude: 1, longitude: 2 })),
      set: vi.fn(async () => undefined),
    };
    const service = new CachingGeocodingService({ geocode }, cache);

    const result = await service.geocode("Alès");

    expect(result).toEqual({ latitude: 1, longitude: 2 });
    expect(geocode).not.toHaveBeenCalled();
    expect(cache.set).not.toHaveBeenCalled();
  });

  it("ne partage aucun état entre deux instances (pas de static)", async () => {
    const geocode = vi.fn(async () => ALES);
    const first = createCachingService(geocode);
    const second = createCachingService(geocode);

    await first.geocode("Alès");
    await second.geocode("Alès");

    expect(geocode).toHaveBeenCalledTimes(2);
  });
});
