import { useEffect, useMemo, useRef, useState } from "react";
import type { ConfirmationResult } from "firebase/auth";
import { Check, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import { getUser } from "../../ultil/auth";
import { filterSupportedBanks } from "./bankPicker";
import {
  createMyPayoutAccount,
  createMyWithdrawal,
  createShopPayoutAccount,
  createShopWithdrawal,
  createWithdrawalAuthorizationChallenge,
  fetchSupportedBanks,
  verifyMyBankAccount,
  verifyShopBankAccount,
  verifyWithdrawalAuthorizationChallenge,
  type BankAccountVerification,
  type PayoutAccount,
  type SupportedBank,
  type WithdrawalAuthorizationChannel,
} from "../../services/wallet.api";
import {
  clearPhoneStepUp,
  confirmPhoneStepUp,
  listenForEmailStepUp,
  sendEmailStepUpLink,
  sendPhoneStepUpCode,
} from "../../services/withdrawal-step-up";
import "../../css/pages/sellerWallet.css";

type Props = {
  open: boolean;
  mode: "add-account" | "withdraw";
  shopId?: string;
  payoutAccounts: PayoutAccount[];
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
};

export default function PayoutAccountModal({
  open,
  mode,
  shopId,
  payoutAccounts,
  onClose,
  onSuccess,
}: Props) {
  const [banks, setBanks] = useState<SupportedBank[]>([]);
  const [bankBin, setBankBin] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [bankPickerOpen, setBankPickerOpen] = useState(false);
  const [highlightedBankIndex, setHighlightedBankIndex] = useState(0);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankVerification, setBankVerification] = useState<BankAccountVerification | null>(null);
  const [amount, setAmount] = useState("");
  const [payoutAccountId, setPayoutAccountId] = useState("");
  const [channel, setChannel] = useState<WithdrawalAuthorizationChannel>("PHONE");
  const [step, setStep] = useState<"form" | "otp" | "email">("form");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const cleanupEmailListener = useRef<null | (() => void)>(null);
  const bankPickerRef = useRef<HTMLDivElement>(null);
  const bankSearchRef = useRef<HTMLInputElement>(null);
  const bankOptionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const challengeIdRef = useRef("");
  const currentUser = getUser() as { email?: string; phone?: string } | null;

  const eligibleAccounts = useMemo(
    () => payoutAccounts.filter(
      (item) =>
        item.verificationStatus === "VERIFIED" &&
        new Date(item.availableAfter).getTime() <= Date.now(),
    ),
    [payoutAccounts],
  );
  const selectedBank = useMemo(
    () => banks.find((item) => item.bin === bankBin) ?? null,
    [bankBin, banks],
  );
  const filteredBanks = useMemo(
    () => filterSupportedBanks(banks, bankSearch),
    [bankSearch, banks],
  );

  useEffect(() => {
    if (!open) return;
    setBankBin("");
    setBankSearch("");
    setBankPickerOpen(false);
    setHighlightedBankIndex(0);
    setAccountNumber("");
    setBankVerification(null);
    setAmount("");
    setPayoutAccountId(eligibleAccounts[0]?.id ?? "");
    setChannel(currentUser?.phone ? "PHONE" : "EMAIL");
    setStep("form");
    setOtp("");
    setConfirmation(null);

    if (mode === "add-account") {
      setLoadingBanks(true);
      fetchSupportedBanks()
        .then((items) => setBanks(items.filter((item) => item.lookupSupported)))
        .catch((error) => toast.error(error instanceof Error ? error.message : "Không thể tải ngân hàng"))
        .finally(() => setLoadingBanks(false));
    }

    return () => {
      cleanupEmailListener.current?.();
      cleanupEmailListener.current = null;
      clearPhoneStepUp();
    };
  }, [open, mode, shopId]);

  useEffect(() => {
    if (!bankPickerOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!bankPickerRef.current?.contains(event.target as Node)) {
        setBankPickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBankPickerOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [bankPickerOpen]);

  useEffect(() => {
    if (!bankPickerOpen) return;
    window.requestAnimationFrame(() => bankSearchRef.current?.focus());
  }, [bankPickerOpen]);

  useEffect(() => {
    bankOptionRefs.current[highlightedBankIndex]?.scrollIntoView({ block: "nearest" });
  }, [bankPickerOpen, highlightedBankIndex]);

  if (!open) return null;

  const close = () => {
    if (busy) return;
    cleanupEmailListener.current?.();
    cleanupEmailListener.current = null;
    clearPhoneStepUp();
    onClose();
  };

  const clearVerification = () => setBankVerification(null);

  const selectBank = (bank: SupportedBank) => {
    setBankBin(bank.bin);
    setBankSearch("");
    setHighlightedBankIndex(0);
    setBankPickerOpen(false);
    clearVerification();
  };

  const handleBankSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedBankIndex((index) => Math.min(index + 1, Math.max(filteredBanks.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedBankIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && filteredBanks[highlightedBankIndex]) {
      event.preventDefault();
      selectBank(filteredBanks[highlightedBankIndex]);
    }
  };

  const verifyBankAccount = async () => {
    if (!bankBin) {
      toast.error("Vui lòng chọn ngân hàng");
      return;
    }
    if (!/^\d{6,19}$/.test(accountNumber)) {
      toast.error("Số tài khoản phải có từ 6 đến 19 chữ số");
      return;
    }
    try {
      setBusy(true);
      const verification = shopId
        ? await verifyShopBankAccount(shopId, bankBin, accountNumber)
        : await verifyMyBankAccount(bankBin, accountNumber);
      setBankVerification(verification);
      toast.success("Đã tìm thấy tài khoản ngân hàng");
    } catch (error) {
      setBankVerification(null);
      toast.error(error instanceof Error ? error.message : "Không tìm thấy tài khoản ngân hàng");
    } finally {
      setBusy(false);
    }
  };

  const validate = () => {
    if (mode === "add-account") {
      if (!bankVerification) {
        throw new Error("Hãy kiểm tra số tài khoản trước khi tiếp tục");
      }
      if (new Date(bankVerification.expiresAt).getTime() <= Date.now()) {
        setBankVerification(null);
        throw new Error("Kết quả kiểm tra đã hết hạn, vui lòng kiểm tra lại");
      }
    } else {
      if (!payoutAccountId) {
        throw new Error("Chưa có tài khoản nhận tiền đã xác minh và hết thời gian chờ");
      }
      if (!Number.isFinite(Number(amount)) || Number(amount) < 100_000) {
        throw new Error("Số tiền rút tối thiểu là 100.000 ₫");
      }
    }
    if (channel === "PHONE" && !currentUser?.phone) {
      throw new Error("Tài khoản chưa có số điện thoại");
    }
    if (channel === "EMAIL" && !currentUser?.email) {
      throw new Error("Tài khoản chưa có email");
    }
  };

  const finalize = async (challengeId: string, firebaseIdToken: string) => {
    const verified = await verifyWithdrawalAuthorizationChallenge(challengeId, firebaseIdToken);
    if (mode === "add-account") {
      if (!bankVerification) throw new Error("Kết quả kiểm tra tài khoản không còn hiệu lực");
      if (shopId) {
        await createShopPayoutAccount(shopId, {
          verificationId: bankVerification.verificationId,
          authorizationToken: verified.authorizationToken,
        });
      } else {
        await createMyPayoutAccount(
          bankVerification.verificationId,
          verified.authorizationToken,
        );
      }
      toast.success("Đã thêm tài khoản ngân hàng đã được nhà cung cấp xác minh");
    } else {
      const payload = {
        amount: Number(amount).toFixed(2),
        payoutAccountId,
        idempotencyKey: crypto.randomUUID(),
        authorizationToken: verified.authorizationToken,
      };
      if (shopId) {
        await createShopWithdrawal(shopId, payload);
      } else {
        await createMyWithdrawal(payload);
      }
      toast.success("Đã tạo yêu cầu rút tiền và khóa số dư tương ứng");
    }
    await onSuccess();
    onClose();
  };

  const confirmOtp = async () => {
    if (!confirmation || !/^\d{6}$/.test(otp)) {
      toast.error("Vui lòng nhập mã OTP gồm 6 số");
      return;
    }
    try {
      setBusy(true);
      const firebaseIdToken = await confirmPhoneStepUp(confirmation, otp);
      if (!challengeIdRef.current) throw new Error("Thiếu mã yêu cầu xác thực");
      await finalize(challengeIdRef.current, firebaseIdToken);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mã OTP không hợp lệ");
    } finally {
      setBusy(false);
    }
  };

  const beginStepUp = async () => {
    try {
      validate();
      setBusy(true);
      const challenge = await createWithdrawalAuthorizationChallenge({
        ...(shopId ? { shopId } : {}),
        operation: mode === "add-account" ? "CREATE_PAYOUT_ACCOUNT" : "CREATE_WITHDRAWAL",
        channel,
        ...(mode === "add-account"
          ? { bankAccountVerificationId: bankVerification!.verificationId }
          : { amount: Number(amount).toFixed(2), payoutAccountId }),
      });
      challengeIdRef.current = challenge.challengeId;
      if (channel === "PHONE") {
        setConfirmation(await sendPhoneStepUpCode(currentUser!.phone!, "wallet-recaptcha"));
        setStep("otp");
        toast.success("Mã OTP đã được gửi qua SMS");
      } else {
        cleanupEmailListener.current = listenForEmailStepUp(
          challenge.challengeId,
          async (firebaseIdToken) => {
            try {
              setBusy(true);
              await finalize(challenge.challengeId, firebaseIdToken);
            } catch (error) {
              toast.error(error instanceof Error ? error.message : "Xác thực email thất bại");
            } finally {
              setBusy(false);
            }
          },
        );
        await sendEmailStepUpLink(currentUser!.email!, challenge.challengeId);
        setStep("email");
        toast.success("Đã gửi liên kết xác thực. Hãy giữ tab này mở.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể bắt đầu xác thực");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="wallet-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && close()}
    >
      <section
        className="wallet-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallet-modal-title"
      >
        <header>
          <div>
            <p>{mode === "add-account" ? "TÀI KHOẢN NHẬN TIỀN" : "RÚT TIỀN AN TOÀN"}</p>
            <h2 id="wallet-modal-title">
              {mode === "add-account" ? "Thêm tài khoản ngân hàng" : "Tạo yêu cầu rút tiền"}
            </h2>
          </div>
          <button type="button" className="wallet-modal-close" onClick={close} aria-label="Đóng">
            ×
          </button>
        </header>

        {step === "form" ? (
          <div className="wallet-modal-body">
            {mode === "add-account" ? (
              <div className="wallet-form-grid">
                <div className="wide wallet-bank-field">
                  <span className="wallet-field-label">Ng&#x00E2;n h&#x00E0;ng</span>
                  <div className="wallet-bank-picker" ref={bankPickerRef}>
                    <button
                      type="button"
                      className="wallet-bank-trigger"
                      disabled={loadingBanks || busy}
                      aria-haspopup="listbox"
                      aria-expanded={bankPickerOpen}
                      aria-controls="wallet-bank-options"
                      onClick={() => {
                        setBankSearch("");
                        setHighlightedBankIndex(0);
                        setBankPickerOpen((current) => !current);
                      }}
                    >
                      {selectedBank ? (
                        <BankIdentity bank={selectedBank} />
                      ) : (
                        <span className="wallet-bank-placeholder">
                          {loadingBanks ? "\u0110ang t\u1ea3i ng\u00e2n h\u00e0ng..." : "Ch\u1ecdn ng\u00e2n h\u00e0ng"}
                        </span>
                      )}
                      <ChevronDown size={18} aria-hidden="true" />
                    </button>
                    {bankPickerOpen ? (
                      <div className="wallet-bank-menu">
                        <div className="wallet-bank-search">
                          <Search size={17} aria-hidden="true" />
                          <input
                            ref={bankSearchRef}
                            value={bankSearch}
                            onChange={(event) => {
                              setBankSearch(event.target.value);
                              setHighlightedBankIndex(0);
                            }}
                            onKeyDown={handleBankSearchKeyDown}
                            placeholder={"T\u00ecm ng\u00e2n h\u00e0ng"}
                            aria-label={"T\u00ecm ng\u00e2n h\u00e0ng"}
                            autoComplete="off"
                          />
                        </div>
                        <div id="wallet-bank-options" className="wallet-bank-options" role="listbox" aria-label={"Danh s\u00e1ch ng\u00e2n h\u00e0ng"}>
                          {filteredBanks.length ? filteredBanks.map((bank, index) => (
                            <button
                              key={bank.bin}
                              ref={(element) => { bankOptionRefs.current[index] = element; }}
                              type="button"
                              role="option"
                              aria-selected={bank.bin === bankBin}
                              className={`wallet-bank-option ${bank.bin === bankBin ? "selected" : ""} ${index === highlightedBankIndex ? "highlighted" : ""}`}
                              onMouseEnter={() => setHighlightedBankIndex(index)}
                              onClick={() => selectBank(bank)}
                            >
                              <BankIdentity bank={bank} />
                              {bank.bin === bankBin ? <Check size={17} aria-hidden="true" /> : null}
                            </button>
                          )) : (
                            <p className="wallet-bank-empty">Kh&ocirc;ng t&igrave;m th&#x1ea5;y ng&#x00e2;n h&agrave;ng ph&ugrave; h&#x1ee3;p.</p>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
                <label className="wide">
                  Số tài khoản
                  <input
                    inputMode="numeric"
                    value={accountNumber}
                    onChange={(event) => {
                      setAccountNumber(event.target.value.replace(/\D/g, "").slice(0, 19));
                      clearVerification();
                    }}
                    autoComplete="off"
                    placeholder="Nhập số tài khoản"
                  />
                </label>
                <div className="wide wallet-bank-lookup-action">
                  <button type="button" onClick={verifyBankAccount} disabled={busy || loadingBanks}>
                    {busy ? "Đang kiểm tra..." : "Kiểm tra tài khoản"}
                  </button>
                </div>
                {bankVerification ? (
                  <div className="wide wallet-bank-verification" role="status">
                    <span>Chủ tài khoản</span>
                    <strong>{bankVerification.accountHolder}</strong>
                    <small>
                      {bankVerification.bank.shortName} · {bankVerification.accountNumberMasked}
                    </small>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="wallet-form-grid">
                <label className="wide">
                  Tài khoản nhận tiền
                  <select value={payoutAccountId} onChange={(event) => setPayoutAccountId(event.target.value)}>
                    <option value="">Chọn tài khoản</option>
                    {eligibleAccounts.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.bankName} · {item.accountNumberMasked} · {item.accountHolder}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="wide">
                  Số tiền
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="Tối thiểu 100000"
                  />
                </label>
              </div>
            )}

            {(mode === "withdraw" || bankVerification) ? (
              <>
                <fieldset className="wallet-channel-picker">
                  <legend>Xác thực người đang thao tác qua</legend>
                  <label>
                    <input
                      type="radio"
                      checked={channel === "PHONE"}
                      disabled={!currentUser?.phone}
                      onChange={() => setChannel("PHONE")}
                    />
                    SMS OTP {currentUser?.phone ? `(${maskContact(currentUser.phone)})` : "(chưa có số điện thoại)"}
                  </label>
                  <label>
                    <input
                      type="radio"
                      checked={channel === "EMAIL"}
                      disabled={!currentUser?.email}
                      onChange={() => setChannel("EMAIL")}
                    />
                    Email link {currentUser?.email ? `(${maskEmail(currentUser.email)})` : "(chưa có email)"}
                  </label>
                </fieldset>
                <p className="wallet-security-note">
                  SMS/email xác minh người đang thao tác. Tên chủ tài khoản do ngân hàng trả về
                  và không bắt buộc trùng tên KYC.
                </p>
              </>
            ) : null}
          </div>
        ) : null}

        {step === "otp" ? (
          <div className="wallet-modal-body wallet-verification-state">
            <h3>Nhập mã SMS OTP</h3>
            <p>Mã chỉ dùng cho thao tác hiện tại và hết hạn sau 5 phút.</p>
            <input
              className="wallet-otp-input"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
              autoFocus
            />
          </div>
        ) : null}
        {step === "email" ? (
          <div className="wallet-modal-body wallet-verification-state">
            <h3>Kiểm tra email</h3>
            <p>
              Mở liên kết Firebase trong email và giữ tab này mở. Hệ thống sẽ tự động tiếp tục
              sau khi xác thực.
            </p>
          </div>
        ) : null}

        <div id="wallet-recaptcha" />
        <footer>
          <button type="button" className="secondary" onClick={close} disabled={busy}>
            Hủy
          </button>
          {step === "form" ? (
            <button
              type="button"
              onClick={beginStepUp}
              disabled={busy || (mode === "add-account" && !bankVerification)}
            >
              {busy ? "Đang gửi..." : "Gửi xác thực"}
            </button>
          ) : null}
          {step === "otp" ? (
            <button type="button" onClick={confirmOtp} disabled={busy}>
              {busy ? "Đang xác thực..." : "Xác nhận OTP"}
            </button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}

function BankIdentity({ bank }: { bank: SupportedBank }) {
  const initials = bank.shortName
    .split(/[\s-]+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <span className="wallet-bank-identity">
      <span className="wallet-bank-logo" data-image-error={!bank.logo} aria-hidden="true">
        {bank.logo ? (
          <img
            src={bank.logo}
            alt=""
            loading="lazy"
            onError={(event) => event.currentTarget.parentElement?.setAttribute("data-image-error", "true")}
          />
        ) : null}
        <span>{initials || "NH"}</span>
      </span>
      <span className="wallet-bank-copy">
        <strong>{bank.shortName}</strong>
      </span>
    </span>
  );
}

const maskContact = (value: string) =>
  value.length > 6 ? `${value.slice(0, 3)}***${value.slice(-3)}` : "***";

const maskEmail = (value: string) => {
  const [name, domain] = value.split("@");
  return `${name?.slice(0, 2) ?? ""}***@${domain ?? ""}`;
};
