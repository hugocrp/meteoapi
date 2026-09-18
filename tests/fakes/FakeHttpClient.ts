import type { HttpClient } from "../../src/http/HttpClient.js";

/**
 * Faux HttpClient utilisé en tests unitaires : aucun réseau, réponses
 * programmées à l'avance ou erreur simulée. C'est le bénéfice concret de
 * l'IoC/DI : on remplace l'implémentation sans toucher au code testé.
 */
export class FakeHttpClient implements HttpClient {
  public readonly requestedUrls: string[] = [];
  private error: Error | undefined;

  constructor(private response: unknown = undefined) {}

  respondWith(response: unknown): void {
    this.response = response;
    this.error = undefined;
  }

  failWith(error: Error): void {
    this.error = error;
  }

  async getJson<T>(url: string): Promise<T> {
    this.requestedUrls.push(url);
    if (this.error) {
      throw this.error;
    }
    return this.response as T;
  }
}
