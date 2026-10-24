import { describe, expect, it } from "vitest";
import { recommendCafes, type RecommendableCafe } from "../src/services/recommendationService.js";

const cafes: RecommendableCafe[] = [
  {
    id: "quiet",
    name: "Quiet Corner",
    address: "Old Town",
    coffeeTypes: ["Pour-over"],
    atmosphere: ["Quiet", "Work-friendly"],
    amenities: ["WiFi"],
  },
  {
    id: "lively",
    name: "Daily Grind",
    address: "Downtown",
    coffeeTypes: ["Espresso"],
    atmosphere: ["Lively"],
  },
];

describe("recommendCafes", () => {
  it("ranks cafes by preference matches and explains the match", () => {
    expect(
      recommendCafes(cafes, {
        drink: "pour over",
        atmosphere: "quiet work",
        location: "old town",
      })
    ).toEqual([
      {
        id: "quiet",
        reason: "Matches your drink, atmosphere, and location preferences.",
      },
    ]);
  });

  it("returns no recommendations when none match", () => {
    expect(
      recommendCafes(cafes, {
        drink: "matcha",
        atmosphere: "beach",
        location: "airport",
      })
    ).toEqual([]);
  });

  it("matches accent-insensitive tokens", () => {
    expect(
      recommendCafes(
        [{ id: "cafe", name: "Cafe Central", atmosphere: ["Cozy"] }],
        { drink: "", atmosphere: "café cozy", location: "" }
      )
    ).toEqual([
      {
        id: "cafe",
        reason: "Matches your atmosphere preferences.",
      },
    ]);
  });
});
