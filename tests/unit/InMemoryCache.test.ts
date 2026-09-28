import { describe, expect, it } from "vitest";
import { InMemoryCache } from "../../src/cache/InMemoryCache.js";

describe("InMemoryCache", () => {
  it("retourne undefined pour une clé absente", async () => {
    const cache = new InMemoryCache<string, number>();

    expect(await cache.get("absent")).toBeUndefined();
  });

  it("retourne la valeur stockée", async () => {
    const cache = new InMemoryCache<string, number>();

    await cache.set("clé", 42);

    expect(await cache.get("clé")).toBe(42);
  });

  it("distingue une valeur null d'une clé absente", async () => {
    const cache = new InMemoryCache<string, number | null>();

    await cache.set("clé", null);

    expect(await cache.get("clé")).toBeNull();
  });

  it("isole les instances les unes des autres", async () => {
    const first = new InMemoryCache<string, number>();
    const second = new InMemoryCache<string, number>();

    await first.set("clé", 1);

    expect(await second.get("clé")).toBeUndefined();
  });
});
