import { describe, expect, it } from "vitest";
import {
  matchingPolicy,
  normalizePhone,
  normalizeName,
  MatchableSupplier,
} from "./matching";

describe("normalizePhone", () => {
  it.each([
    ["0300-1234567", "+923001234567"],
    ["+92300-1234567", "+923001234567"],
    ["00923001234567", "+923001234567"],
    ["923001234567", "+923001234567"],
    ["03001234567", "+923001234567"],
    ["123456789012", "+123456789012"],
  ])("normalizes %s to %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it("returns original for short numbers (<8 digits)", () => {
    expect(normalizePhone("123")).toBe("123");
    expect(normalizePhone("92300")).toBe("92300");
    expect(normalizePhone("")).toBe("");
  });
});

describe("normalizeName", () => {
  it("removes punctuation and lowercases", () => {
    expect(normalizeName("Ali's Workshop!")).toBe("alisworkshop");
  });
});

describe("matchingPolicy", () => {
  const baseSupplier: MatchableSupplier = {
    name: "Ali Stitching",
    area: "Gulberg",
    phone: "0300-1234567",
    geopoint: { latitude: 31.5, longitude: 74.35 },
  };

  describe("isExactPhoneMatch", () => {
    it("matches normalized phones", () => {
      expect(
        matchingPolicy.isExactPhoneMatch("0300-1234567", "+923001234567")
      ).toBe(true);
    });

    it("rejects different phones", () => {
      expect(
        matchingPolicy.isExactPhoneMatch("0300-1234567", "0301-1234567")
      ).toBe(false);
    });
  });

  describe("isFuzzyMatch", () => {
    it("matches when name, area, and geo are close", () => {
      const other: MatchableSupplier = {
        name: "Ali Stitchings",
        area: "gulberg",
        phone: "0301-1234567",
        geopoint: { latitude: 31.5005, longitude: 74.3505 },
      };
      expect(matchingPolicy.isFuzzyMatch(baseSupplier, other)).toBe(true);
    });

    it("rejects when area differs", () => {
      const other: MatchableSupplier = {
        name: "Ali Stitching",
        area: "Model Town",
        phone: "0301-1234567",
        geopoint: { latitude: 31.5005, longitude: 74.3505 },
      };
      expect(matchingPolicy.isFuzzyMatch(baseSupplier, other)).toBe(false);
    });

    it("rejects when geo is far", () => {
      const other: MatchableSupplier = {
        name: "Ali Stitching",
        area: "Gulberg",
        phone: "0301-1234567",
        geopoint: { latitude: 31.6, longitude: 74.45 },
      };
      expect(matchingPolicy.isFuzzyMatch(baseSupplier, other)).toBe(false);
    });

    it("matches on name + area when geo missing", () => {
      const other: MatchableSupplier = {
        name: "Ali Stitching",
        area: "Gulberg",
        phone: "0301-1234567",
      };
      expect(matchingPolicy.isFuzzyMatch(baseSupplier, other)).toBe(true);
    });

    it("handles empty normalized names", () => {
      const other: MatchableSupplier = {
        name: "!",
        area: "Gulberg",
        phone: "0301-1234567",
        geopoint: { latitude: 31.5005, longitude: 74.3505 },
      };
      expect(
        matchingPolicy.isFuzzyMatch({ ...baseSupplier, name: "?" }, other)
      ).toBe(true);
    });
  });

  describe("shouldAutoMergeToFuzzy", () => {
    it("returns auto-merge on exact phone", () => {
      const other: MatchableSupplier = {
        ...baseSupplier,
        phone: "+923001234567",
      };
      expect(matchingPolicy.shouldAutoMergeToFuzzy(baseSupplier, other)).toBe(
        "auto-merge"
      );
    });

    it("returns fuzzy-flag on fuzzy match", () => {
      const other: MatchableSupplier = {
        name: "Ali Stitchings",
        area: "gulberg",
        phone: "0301-1234567",
        geopoint: { latitude: 31.5005, longitude: 74.3505 },
      };
      expect(matchingPolicy.shouldAutoMergeToFuzzy(baseSupplier, other)).toBe(
        "fuzzy-flag"
      );
    });

    it("returns distinct when nothing matches", () => {
      const other: MatchableSupplier = {
        name: "Bilal Fabrics",
        area: "Model Town",
        phone: "0301-1234567",
        geopoint: { latitude: 31.6, longitude: 74.45 },
      };
      expect(matchingPolicy.shouldAutoMergeToFuzzy(baseSupplier, other)).toBe(
        "distinct"
      );
    });
  });
});
