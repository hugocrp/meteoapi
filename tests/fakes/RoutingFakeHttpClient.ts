import type { HttpClient } from "../../src/http/HttpClient.js";

export interface FakeHttpRoute {
  match: string;
  response: unknown;
}

export class RoutingFakeHttpClient implements HttpClient {
  public readonly requestedUrls: string[] = [];

  constructor(private readonly routes: FakeHttpRoute[]) {}

  async getJson<T>(url: string): Promise<T> {
    this.requestedUrls.push(url);
    const route = this.routes.find((candidate) => url.includes(candidate.match));
    if (!route) {
      throw new Error(`Aucune route simulée pour ${url}`);
    }
    return route.response as T;
  }

  countRequests(match: string): number {
    return this.requestedUrls.filter((url) => url.includes(match)).length;
  }
}
