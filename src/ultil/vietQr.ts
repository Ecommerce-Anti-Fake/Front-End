type VietQrInput = {
  bankBin: string | null;
  accountNumber: string;
  amount: string;
  transferContent: string;
};

const tlv = (tag: string, value: string) => `${tag}${String(value.length).padStart(2, "0")}${value}`;

const crc16CcittFalse = (value: string) => {
  let crc = 0xffff;
  for (const character of value) {
    crc ^= character.charCodeAt(0) << 8;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) !== 0 ? (crc << 1) ^ 0x1021 : crc << 1;
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
};

export const buildVietQrPayload = ({ bankBin, accountNumber, amount, transferContent }: VietQrInput) => {
  const normalizedBankBin = bankBin ?? "";
  if (!/^\d{6}$/.test(normalizedBankBin)) throw new Error("Tài khoản chưa có mã BIN ngân hàng hợp lệ");
  if (!/^\d{6,19}$/.test(accountNumber)) throw new Error("Số tài khoản không hợp lệ để tạo QR");
  if (transferContent.length > 25) {
    throw new Error("Nội dung chuyển khoản quá dài");
  }

  const amountValue = String(Math.round(Number(amount)));
  if (!/^\d{1,13}$/.test(amountValue)) throw new Error("Số tiền không hợp lệ để tạo QR");

  const beneficiary = tlv("00", normalizedBankBin) + tlv("01", accountNumber);
  const merchantAccount = tlv("00", "A000000727") + tlv("01", beneficiary) + tlv("02", "QRIBFTTA");
  const additionalData = tlv("08", transferContent);
  const payload = [
    tlv("00", "01"),
    tlv("01", "12"),
    tlv("38", merchantAccount),
    tlv("53", "704"),
    tlv("54", amountValue),
    tlv("58", "VN"),
    tlv("62", additionalData),
    "6304",
  ].join("");

  return `${payload}${crc16CcittFalse(payload)}`;
};
