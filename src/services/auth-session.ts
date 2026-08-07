export async function restoreSessionIfNeeded({
  hasAccessToken,
  refresh,
}: {
  hasAccessToken: boolean;
  refresh: () => Promise<unknown>;
}) {
  if (hasAccessToken) return true;

  try {
    await refresh();
    return true;
  } catch {
    return false;
  }
}
