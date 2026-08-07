export function isRemoteLogoutEvent(event: {
  key: string | null;
  newValue: string | null;
}) {
  return event.key === "accessToken" && event.newValue === null;
}
