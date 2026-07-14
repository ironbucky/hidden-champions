import { describe, expect, it } from "vitest";
import { expiryPolicy, ExpirableRequest } from "./expiry";

describe("expiryPolicy", () => {
  describe("computeExpiry", () => {
    it("adds the given number of days and sets end of day", () => {
      const created = new Date("2026-06-21T10:00:00.000Z");
      const expiry = expiryPolicy.computeExpiry(created, 7);
      expect(expiry.toISOString()).toBe("2026-06-28T23:59:59.999Z");
    });
  });

  describe("computeStaleBountyAt", () => {
    it("adds the given number of days and sets start of day", () => {
      const created = new Date("2026-06-21T10:00:00.000Z");
      const staleAt = expiryPolicy.computeStaleBountyAt(created, 4);
      expect(staleAt.toISOString()).toBe("2026-06-25T00:00:00.000Z");
    });
  });

  describe("isStaleBountyEligible", () => {
    it("returns true when now is at or past stale bounty time", () => {
      const request: ExpirableRequest = {
        createdAt: new Date("2026-06-21T10:00:00.000Z"),
        staleBountyAt: new Date("2026-06-25T00:00:00.000Z"),
      };
      const now = new Date("2026-06-25T10:00:00.000Z");
      expect(expiryPolicy.isStaleBountyEligible(request, now)).toBe(true);
    });

    it("returns false before stale bounty time", () => {
      const request: ExpirableRequest = {
        createdAt: new Date("2026-06-21T10:00:00.000Z"),
        staleBountyAt: new Date("2026-06-25T00:00:00.000Z"),
      };
      const now = new Date("2026-06-24T23:59:59.000Z");
      expect(expiryPolicy.isStaleBountyEligible(request, now)).toBe(false);
    });

    it("returns false when no stale bounty time is set", () => {
      const request: ExpirableRequest = {
        createdAt: new Date("2026-06-21T10:00:00.000Z"),
      };
      const now = new Date("2026-06-30T00:00:00.000Z");
      expect(expiryPolicy.isStaleBountyEligible(request, now)).toBe(false);
    });
  });
});
