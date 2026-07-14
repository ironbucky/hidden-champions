export enum RequestState {
  Draft = "draft",
  Open = "open",
  Answered = "answered",
  Confirmed = "confirmed",
  Rejected = "rejected",
  Expired = "expired",
  FlaggedClosed = "flagged-closed",
}

export const requestStatePolicy = {
  allowedTransitions(fromState: RequestState): Set<RequestState> {
    const transitions: Record<RequestState, RequestState[]> = {
      [RequestState.Draft]: [RequestState.Open],
      [RequestState.Open]: [
        RequestState.Answered,
        RequestState.Expired,
        RequestState.FlaggedClosed,
      ],
      [RequestState.Answered]: [RequestState.Confirmed, RequestState.Rejected],
      [RequestState.Confirmed]: [],
      [RequestState.Rejected]: [RequestState.Open],
      [RequestState.Expired]: [],
      [RequestState.FlaggedClosed]: [],
    };

    return new Set(transitions[fromState]);
  },

  canTransition(from: RequestState, to: RequestState): boolean {
    return this.allowedTransitions(from).has(to);
  },

  canAcceptAnswers(state: RequestState): boolean {
    return state === RequestState.Open;
  },
};
