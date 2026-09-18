import { inject, injectable } from "tsyringe";
import type { HttpClient } from "./HttpClient.js";
import { HTTP_USER_AGENT } from "../di/tokens.js";

@injectable()
export class FetchHttpClient implements HttpClient {
  constructor(@inject(HTTP_USER_AGENT) private readonly userAgent: string) {}

  async getJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": this.userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Requête HTTP échouée (${response.status}) vers ${url}`);
    }

    return (await response.json()) as T;
  }
}
