export const shouldFallbackToFirebase = (error: unknown) =>
  Boolean(
    error &&
      typeof error === "object" &&
      "name" in error &&
      error.name === "AuthApiError" &&
      "status" in error &&
      error.status === 401,
  );
