import { OpenMeteoWeatherService } from "../../src/services/OpenMeteoWeatherService.js";
import { MetNorwayWeatherService } from "../../src/services/MetNorwayWeatherService.js";
import { describeWeatherServiceContract } from "./weatherServiceContract.js";

describeWeatherServiceContract("Open-Meteo", {
  createService: (httpClient) => new OpenMeteoWeatherService(httpClient),
  sampleResponse: {
    hourly: {
      time: ["2026-09-18T00:00", "2026-09-18T01:00"],
      temperature_2m: [14.9, 14.8],
      relative_humidity_2m: [60, 61],
      precipitation: [0, 0],
      wind_speed_10m: [7.4, 8],
      shortwave_radiation: [0, 0],
    },
  },
  coordinates: { latitude: 44.13, longitude: 4.08 },
  emptyResponse: { hourly: { time: [] } },
});

describeWeatherServiceContract("MET Norway", {
  createService: (httpClient) => new MetNorwayWeatherService(httpClient),
  sampleResponse: {
    properties: {
      timeseries: [
        {
          time: "2026-09-18T00:00:00Z",
          data: { instant: { details: { air_temperature: 14.9, relative_humidity: 60, wind_speed: 7.4 } } },
        },
        {
          time: "2026-09-18T01:00:00Z",
          data: { instant: { details: { air_temperature: 14.8, relative_humidity: 61, wind_speed: 8.0 } } },
        },
      ],
    },
  },
  coordinates: { latitude: 44.13, longitude: 4.08 },
  emptyResponse: { properties: { timeseries: [] } },
});
