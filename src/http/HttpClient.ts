/**
 * Abstraction du transport HTTP : les services métier ne dépendent que de
 * cette interface, jamais de `fetch` ni d'une librairie HTTP concrète.
 * Permet l'injection d'un faux client en tests (couplage faible / IoC).
 */
export interface HttpClient {
  getJson<T>(url: string): Promise<T>;
}
