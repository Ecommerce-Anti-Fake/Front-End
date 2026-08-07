export async function terminateSession({
  revoke,
  clearLocal,
  disconnect,
  redirect,
}: {
  revoke: () => Promise<unknown>;
  clearLocal: () => void;
  disconnect: () => void;
  redirect: () => void;
}) {
  try {
    await revoke();
  } finally {
    try {
      clearLocal();
    } finally {
      try {
        disconnect();
      } finally {
        redirect();
      }
    }
  }
}
