import { injectable } from "tsyringe";
import type { Cache } from "./Cache.js";

@injectable()
export class InMemoryCache<K, V> implements Cache<K, V> {
  private readonly entries = new Map<K, V>();

  async get(key: K): Promise<V | undefined> {
    return this.entries.get(key);
  }

  async set(key: K, value: V): Promise<void> {
    this.entries.set(key, value);
  }
}
