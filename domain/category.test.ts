import { describe, expect, it } from "vitest";
import { ApprovedCategory, categoryPolicy } from "./category";

const approved: ApprovedCategory[] = [
  { id: "1", name: "Garment Stitching", slug: "garment-stitching" },
  { id: "2", name: "Embroidery", slug: "embroidery" },
];

describe("categoryPolicy", () => {
  describe("isApprovedCategory", () => {
    it("returns true for approved name", () => {
      expect(categoryPolicy.isApprovedCategory("Embroidery", approved)).toBe(
        true
      );
    });

    it("returns true for approved slug", () => {
      expect(
        categoryPolicy.isApprovedCategory("garment-stitching", approved)
      ).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(categoryPolicy.isApprovedCategory("embroidery", approved)).toBe(
        true
      );
    });

    it("returns false for unknown category", () => {
      expect(categoryPolicy.isApprovedCategory("Dyeing", approved)).toBe(false);
    });
  });

  describe("canSuggest", () => {
    it("allows a new category name", () => {
      const result = categoryPolicy.canSuggest("Leather Tanning", [
        "Garment Stitching",
        "Embroidery",
      ]);
      expect(result.ok).toBe(true);
    });

    it("rejects a duplicate name", () => {
      const result = categoryPolicy.canSuggest("Embroidery", [
        "Garment Stitching",
        "Embroidery",
      ]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("A matching category already exists");
      }
    });

    it("rejects a name that is too short", () => {
      const result = categoryPolicy.canSuggest("A", ["Embroidery"]);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toBe("Category name is too short");
      }
    });

    it("rejects a duplicate ignoring case", () => {
      const result = categoryPolicy.canSuggest("embroidery", [
        "Garment Stitching",
        "Embroidery",
      ]);
      expect(result.ok).toBe(false);
    });
  });
});
