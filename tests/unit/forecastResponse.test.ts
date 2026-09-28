import { describe, expect, it } from "vitest";
import { toForecastResponse } from "../../src/controllers/forecastResponse.js";

describe("toForecastResponse", () => {
  it("aplatit les coordonnées et associe chaque heure à sa température", () => {
    const response = toForecastResponse({
      address: "Alès",
      coordinates: { latitude: 44.1279, longitude: 4.0817 },
      hourly: {
        time: ["2025-06-10T14:00:00Z", "2025-06-10T15:00:00Z"],
        variables: { temperature_2m: [24.3, 25.1], precipitation: [0, 0] },
      },
    });

    expect(response).toEqual({
      address: "Alès",
      latitude: 44.1279,
      longitude: 4.0817,
      hourly: [
        { time: "2025-06-10T14:00:00Z", temperatureCelsius: 24.3 },
        { time: "2025-06-10T15:00:00Z", temperatureCelsius: 25.1 },
      ],
    });
  });

  it("n'expose aucune variable autre que la température", () => {
    const response = toForecastResponse({
      address: "Alès",
      coordinates: { latitude: 0, longitude: 0 },
      hourly: {
        time: ["2025-06-10T14:00:00Z"],
        variables: { temperature_2m: [24.3], wind_speed_10m: [3], precipitation: [1] },
      },
    });

    expect(Object.keys(response.hourly[0] ?? {}).sort()).toEqual(["temperatureCelsius", "time"]);
  });

  it("garde le champ temperatureCelsius à null quand la valeur est absente", () => {
    const response = toForecastResponse({
      address: "Alès",
      coordinates: { latitude: 0, longitude: 0 },
      hourly: { time: ["2025-06-10T14:00:00Z"], variables: {} },
    });

    expect(response.hourly).toEqual([{ time: "2025-06-10T14:00:00Z", temperatureCelsius: null }]);
  });
});
