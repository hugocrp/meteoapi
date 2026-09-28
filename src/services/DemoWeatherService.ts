import { injectable } from "tsyringe";
import type { HourlyForecast } from "../domain/types.js";
import type { WeatherService } from "./WeatherService.js";

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

@injectable()
export class DemoWeatherService implements WeatherService {
  async getHourlyForecast(): Promise<HourlyForecast> {
    return {
      time: HOURS.map((hour) => `2025-06-10T${String(hour).padStart(2, "0")}:00:00Z`),
      variables: {
        temperature_2m: HOURS.map((hour) => Math.round((18 + 6 * Math.sin(((hour - 9) / 24) * 2 * Math.PI)) * 10) / 10),
      },
    };
  }
}
