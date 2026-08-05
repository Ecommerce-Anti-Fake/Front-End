import type { SupportedBank } from "../../services/wallet.api";

export const normalizeBankSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("vi-VN")
    .trim();

export const filterSupportedBanks = (
  banks: SupportedBank[],
  query: string,
) => {
  const normalizedQuery = normalizeBankSearchText(query);
  if (!normalizedQuery) return banks;

  return banks.filter((bank) =>
    [bank.shortName, bank.name, bank.code, bank.bin]
      .map(normalizeBankSearchText)
      .some((value) => value.includes(normalizedQuery)),
  );
};
