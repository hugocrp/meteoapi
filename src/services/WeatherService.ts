import type { Coordinates, HourlyForecast } from "../domain/types.js";

export interface WeatherService {
  getHourlyForecast(coordinates: Coordinates): Promise<HourlyForecast>;
}
