import type { Coordinates, HourlyForecast } from "../../src/domain/types.js";
import type { WeatherService } from "../../src/services/WeatherService.js";

export class FakeWeatherService implements WeatherService {
  public lastRequestedCoordinates: Coordinates | undefined;
  private error: Error | undefined;

  constructor(
    private hourly: HourlyForecast = { time: [], variables: {} },
  ) {}

  respondWith(hourly: HourlyForecast): void {
    this.hourly = hourly;
    this.error = undefined;
  }

  failWith(error: Error): void {
    this.error = error;
  }

  async getHourlyForecast(coordinates: Coordinates): Promise<HourlyForecast> {
    this.lastRequestedCoordinates = coordinates;
    if (this.error) {
      throw this.error;
    }
    return this.hourly;
  }
}
