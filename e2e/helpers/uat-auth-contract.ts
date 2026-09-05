export type UatAuthRole = "buyer" | "seller" | "admin";

type UatAuthEnvironment = Record<string, string | undefined>;

type UatAuthDefinition = {
  email: string;
  password: string;
};

const definitions: Record<UatAuthRole, UatAuthDefinition> = {
  buyer: {
    email: "ANTIFAKE_UAT_BUYER_EMAIL",
    password: "ANTIFAKE_UAT_BUYER_PASSWORD",
  },
  seller: {
    email: "ANTIFAKE_UAT_SELLER_EMAIL",
    password: "ANTIFAKE_UAT_SELLER_PASSWORD",
  },
  admin: {
    email: "ANTIFAKE_UAT_ADMIN_EMAIL",
    password: "ANTIFAKE_UAT_ADMIN_PASSWORD",
  },
};

// The current domain model represents both Buyer and Seller accounts as the
// generic `user` role. Seller capability is verified separately from the
// authenticated user's owned-shop claim and the protected Seller route.
const acceptedServerRoles: Record<UatAuthRole, readonly string[]> = {
  buyer: ["buyer", "user"],
  seller: ["seller", "user"],
  admin: ["admin"],
};

const hasText = (value: string | undefined) => Boolean(value?.trim());

export type UatAuthInput = {
  role: UatAuthRole;
  email: string;
  password: string;
};

export function readUatAuthInput(
  role: UatAuthRole,
  environment: UatAuthEnvironment = process.env,
): UatAuthInput | undefined {
  const definition = definitions[role];
  const email = environment[definition.email]?.trim();
  const password = environment[definition.password];

  if (!hasText(email) || !hasText(password)) return undefined;

  return { role, email: email!, password: password! };
}

export function getUatAuthAvailability(
  environment: UatAuthEnvironment = process.env,
) {
  return {
    buyer: Boolean(readUatAuthInput("buyer", environment)),
    seller: Boolean(readUatAuthInput("seller", environment)),
    admin: Boolean(readUatAuthInput("admin", environment)),
  };
}

export function assertUatCredentialNamespace(
  role: UatAuthRole,
  email: string,
) {
  const normalizedEmail = email.toLowerCase();
  const valid =
    role === "admin"
      ? normalizedEmail === "admin@antifake.io.vn" ||
        normalizedEmail.endsWith("@antifake.local")
      : normalizedEmail.endsWith("@antifake.local");

  if (!valid) {
    throw new Error(`UAT ${role} credential namespace is invalid`);
  }
}

export function assertUatRole(
  actualRole: unknown,
  expectedRole: UatAuthRole,
): asserts actualRole is string {
  const normalizedRole =
    typeof actualRole === "string" ? actualRole.toLowerCase() : undefined;
  if (
    !normalizedRole ||
    !acceptedServerRoles[expectedRole].includes(normalizedRole)
  ) {
    throw new Error(`UAT ${expectedRole} role verification failed`);
  }
}

export function assertUatSellerAccount(
  expectedRole: UatAuthRole,
  shopId: unknown,
) {
  if (
    expectedRole === "seller" &&
    (typeof shopId !== "string" || !shopId.trim())
  ) {
    throw new Error("UAT seller role verification failed");
  }
}
