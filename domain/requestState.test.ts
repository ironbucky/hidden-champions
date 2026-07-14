import { describe, expect, it } from "vitest";
import { requestStatePolicy, RequestState } from "./requestState";

describe("requestStatePolicy", () => {
  describe("allowedTransitions", () => {
    it.each([
      [RequestState.Draft, [RequestState.Open]],
      [
        RequestState.Open,
        [
          RequestState.Answered,
          RequestState.Expired,
          RequestState.FlaggedClosed,
        ],
      ],
      [RequestState.Answered, [RequestState.Confirmed, RequestState.Rejected]],
      [RequestState.Confirmed, []],
      [RequestState.Rejected, [RequestState.Open]],
      [RequestState.Expired, []],
      [RequestState.FlaggedClosed, []],
    ] as [RequestState, RequestState[]][])(
      "from %s allows %s",
      (from, expected) => {
        expect(requestStatePolicy.allowedTransitions(from)).toEqual(
          new Set(expected)
        );
      }
    );
  });

  describe("canTransition", () => {
    it.each([
      [RequestState.Open, RequestState.Answered, true],
      [RequestState.Answered, RequestState.Open, false],
      [RequestState.Answered, RequestState.Confirmed, true],
      [RequestState.Confirmed, RequestState.Open, false],
      [RequestState.Open, RequestState.Confirmed, false],
    ] as [RequestState, RequestState, boolean][])(
      "%s -> %s returns %s",
      (from, to, expected) => {
        expect(requestStatePolicy.canTransition(from, to)).toBe(expected);
      }
    );
  });

  describe("canAcceptAnswers", () => {
    it.each([
      [RequestState.Open, true],
      [RequestState.Draft, false],
      [RequestState.Answered, false],
      [RequestState.Confirmed, false],
      [RequestState.Rejected, false],
      [RequestState.Expired, false],
      [RequestState.FlaggedClosed, false],
    ])("%s can accept answers = %s", (state, expected) => {
      expect(requestStatePolicy.canAcceptAnswers(state)).toBe(expected);
    });
  });
});
