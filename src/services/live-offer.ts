export function isLiveOfferSoldOut(availableQuantity: number): boolean {
  return availableQuantity <= 0;
}

export function isPinnedOfferEventForSession(
  sessionId: string,
  event: { sessionId?: string },
): boolean {
  return Boolean(sessionId) && event.sessionId === sessionId;
}
