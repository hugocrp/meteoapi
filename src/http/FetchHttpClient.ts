import { injectable } from "tsyringe";
import type { HttpClient } from "./HttpClient.js";

/**
 * Seule implémentation concrète de HttpClient, seule à connaître `fetch`.
 * Toute la reste de l'application ne manipule que l'interface HttpClient.
 * @injectable() : rend la classe résolvable par le conteneur tsyringe.
 */
@injectable()
export class FetchHttpClient implements HttpClient {
  async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        // Nominatim exige un User-Agent identifiable (politique d'usage) ;
        // un client HTTP générique est rejeté. Personnalisable via env var.
        "User-Agent": process.env.HTTP_USER_AGENT ?? "meteoapi-tp1 (contact: set HTTP_USER_AGENT env var)",
      },
    });

    if (!response.ok) {
      throw new Error(`Requête HTTP échouée (${response.status}) vers ${url}`);
    }

    return (await response.json()) as T;
  }
}
