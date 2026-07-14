import { describe, expect, it } from "vitest";
import { contactUnlockPolicy, UnlockUser } from "./contactUnlock";

describe("contactUnlockPolicy", () => {
  const verifiedUser: UnlockUser = {
    verifiedAt: new Date(),
    role: "user",
  };

  describe("canUnlock", () => {
    it("allows verified users under quota", () => {
      expect(contactUnlockPolicy.canUnlock(verifiedUser, 3, 10)).toBe(true);
    });

    it("denies when quota is reached", () => {
      expect(contactUnlockPolicy.canUnlock(verifiedUser, 10, 10)).toBe(false);
    });

    it("denies unverified users", () => {
      const pendingUser: UnlockUser = { role: "pending" };
      expect(contactUnlockPolicy.canUnlock(pendingUser, 0, 10)).toBe(false);
    });

    it("denies users without verifiedAt", () => {
      const noDateUser: UnlockUser = { role: "user" };
      expect(contactUnlockPolicy.canUnlock(noDateUser, 0, 10)).toBe(false);
    });

    it("denies users with verifiedAt but pending role", () => {
      const weirdUser: UnlockUser = { verifiedAt: new Date(), role: "pending" };
      expect(contactUnlockPolicy.canUnlock(weirdUser, 0, 10)).toBe(false);
    });
  });

  describe("remainingQuota", () => {
    it.each([
      [0, 10, 10],
      [5, 10, 5],
      [10, 10, 0],
      [15, 10, 0],
    ])("dailyCount %s quota %s returns %s", (count, quota, expected) => {
      expect(contactUnlockPolicy.remainingQuota(count, quota)).toBe(expected);
    });
  });
});
