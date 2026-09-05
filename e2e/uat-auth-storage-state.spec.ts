import { access } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  createAuthenticatedPage,
  getUatStorageStatePath,
} from "./helpers/session";
import {
  getUatAuthAvailability,
  type UatAuthRole,
} from "./helpers/uat-auth-contract";

const roles: UatAuthRole[] = ["buyer", "seller", "admin"];
const available = getUatAuthAvailability();

for (const role of roles) {
  test(`${role} storage state is generated ephemerally and removed on close`, async ({
    browser,
  }, testInfo) => {
    test.skip(
      !available[role],
      `Set the injected ${role} UAT credential pair for storage-state verification`,
    );

    const storageStatePath = getUatStorageStatePath(
      role,
      testInfo.project.name,
    );
    const session = await createAuthenticatedPage(browser, role, testInfo);
    try {
      await expect(session.page).not.toHaveURL(/\/auth(?:\/|\?|$)/i);
      await expect(session.page.locator("body")).not.toBeEmpty();
      await access(storageStatePath);
    } finally {
      await session.close();
    }

    await expect(access(storageStatePath)).rejects.toThrow();
  });
}
