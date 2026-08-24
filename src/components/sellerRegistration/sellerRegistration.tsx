import { Check } from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../../css/components/sellerRegistration/sellerRegistration.css";
import { fetchCategories } from "../../services/category.api";
import {
  createShop,
  fetchShopDocumentRequirements,
  fetchShopSubmittedDocuments,
  getMyShop,
  submitShopDocuments,
  type ShopDocumentRequirement,
  type ShopSubmittedDocument,
} from "../../services/shop.api";
import {
  getUserKyc,
  submitUserKyc,
  type UserKyc,
} from "../../services/user.api";
import LoadingOverlay from "../loadingOverlay";
import CompletionStep from "./CompletionStep";
import StoreInfoStep from "./StoreInfoStep";
import VerificationStep from "./VerificationStep";
import ContextualHelpLink from "../help/contextualHelpLink";

export type RegistrationStep = 1 | 2 | 3;
export type BusinessType = "MANUFACTURER" | "DISTRIBUTOR";
export type ShopRegistrationType =
  | "NORMAL"
  | "HANDMADE"
  | "MANUFACTURER"
  | "DISTRIBUTOR";
export type RegistrationStatus = "pending_kyc" | "rejected" | "success";

export type RegistrationForm = {
  storeName: string;
  registrationType: ShopRegistrationType;
  taxCode: string;
  phone: string;
  businessType: BusinessType;
  categoryIds: string[];
  identityType: string;
};

export type UploadedAsset = {
  file: File;
  name: string;
  mimeType: string;
  previewUrl: string;
};

export type UploadedFiles = {
  identityFront?: UploadedAsset;
  identityBack?: UploadedAsset;
  requirements: Record<string, UploadedAsset[]>;
};

export type ShopCategory = {
  id: string | number;
  name: string;
};

type RegisterRouteState = {
  initialStep?: RegistrationStep;
  registrationStatus?: RegistrationStatus;
  shopId?: string;
};

type RegisteredShop = {
  id?: string;
  shopId?: string;
  shopStatus?: string;
};

const initialRegistrationForm: RegistrationForm = {
  storeName: "",
  registrationType: "NORMAL",
  taxCode: "",
  phone: "",
  businessType: "MANUFACTURER",
  categoryIds: [],
  identityType: "CCCD",
};

const initialUploadedFiles: UploadedFiles = {
  requirements: {},
};

const registrationSteps = [
  { id: 1, title: "Thông tin cửa hàng" },
  { id: 2, title: "Xác thực tài liệu" },
  { id: 3, title: "Hoàn tất" },
] as const;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === "object");

const normalizeCategories = (data: unknown): ShopCategory[] => {
  const response =
    isRecord(data) ? (data as { data?: unknown; items?: unknown }) : null;
  const payload = response?.data ?? response?.items ?? data;
  return Array.isArray(payload) ? payload : [];
};

const normalizeMyShop = (data: unknown): RegisteredShop | null => {
  const payload = isRecord(data) ? data.data ?? data.items ?? data : data;
  if (Array.isArray(payload)) {
    return (payload[0] as RegisteredShop | undefined) ?? null;
  }
  return isRecord(payload) ? (payload as RegisteredShop) : null;
};

const isExistingShopError = (error: unknown) =>
  getErrorMessage(error, "").toLowerCase().includes("only create one shop");

const createUploadedAsset = (file: File): UploadedAsset => ({
  file,
  name: file.name,
  mimeType: file.type || "image/jpeg",
  previewUrl: URL.createObjectURL(file),
});

const revokeUploadedFiles = (uploadedFiles: UploadedFiles) => {
  if (uploadedFiles.identityFront) {
    URL.revokeObjectURL(uploadedFiles.identityFront.previewUrl);
  }
  if (uploadedFiles.identityBack) {
    URL.revokeObjectURL(uploadedFiles.identityBack.previewUrl);
  }
  Object.values(uploadedFiles.requirements).forEach((assets) => {
    assets.forEach((asset) => URL.revokeObjectURL(asset.previewUrl));
  });
};

export default function SellerRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state as RegisterRouteState | null;
  const [step, setStep] = useState<RegistrationStep>(
    routeState?.initialStep ?? 1,
  );
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>(routeState?.registrationStatus ?? "success");
  const [form, setForm] = useState<RegistrationForm>(initialRegistrationForm);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [files, setFiles] = useState<UploadedFiles>(initialUploadedFiles);
  const [shopId, setShopId] = useState(routeState?.shopId ?? "");
  const [documentRequirements, setDocumentRequirements] = useState<
    ShopDocumentRequirement[]
  >([]);
  const [documentShopTypeName, setDocumentShopTypeName] = useState("");
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [checkingExistingShop, setCheckingExistingShop] = useState(
    !routeState?.initialStep && !routeState?.shopId,
  );
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingReviewDetails, setLoadingReviewDetails] = useState(false);
  const [shopReviewDocuments, setShopReviewDocuments] = useState<
    ShopSubmittedDocument[]
  >([]);
  const [userKycReview, setUserKycReview] = useState<UserKyc | null>(null);
  const isRejectedRegistration = registrationStatus === "rejected";

  const completedSteps = useMemo(
    () =>
      registrationSteps.filter((item) => item.id < step).map((item) => item.id),
    [step],
  );

  useEffect(() => {
    if (routeState?.initialStep || routeState?.shopId) return;

    let cancelled = false;

    const loadExistingShop = async () => {
      try {
        const existingShop = normalizeMyShop(await getMyShop());
        if (cancelled || !existingShop) return;

        const existingShopId = existingShop.id || existingShop.shopId;
        if (!existingShopId) return;

        const nextShopId = String(existingShopId);
        const isRejected = existingShop.shopStatus === "rejected";
        setShopId(nextShopId);
        setRegistrationStatus(isRejected ? "rejected" : "success");
        setStep(isRejected ? 3 : 2);
        navigate("/register", {
          replace: true,
          state: {
            initialStep: isRejected ? 3 : 2,
            registrationStatus: isRejected ? "rejected" : "success",
            shopId: nextShopId,
          },
        });
      } catch {
        // A missing shop is the normal path for a new registration.
      } finally {
        if (!cancelled) setCheckingExistingShop(false);
      }
    };

    loadExistingShop();

    return () => {
      cancelled = true;
    };
  }, [navigate, routeState?.initialStep, routeState?.shopId]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories();
        setCategories(normalizeCategories(data));
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Lấy danh mục thất bại"));
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    if (step !== 2 || !shopId) return;

    const loadRequirements = async () => {
      setLoadingRequirements(true);
      try {
        const data = await fetchShopDocumentRequirements(shopId);
        const sortedRequirements = [...data.requirements].sort(
          (first, second) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0),
        );
        setDocumentRequirements(sortedRequirements);
        setDocumentShopTypeName(data.shopType?.name ?? data.shopType?.code ?? "");
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Lấy danh sách giấy tờ thất bại"));
      } finally {
        setLoadingRequirements(false);
      }
    };

    loadRequirements();
  }, [step, shopId]);

  useEffect(() => {
    if (!isRejectedRegistration || !shopId) return;

    const loadReviewDetails = async () => {
      setLoadingReviewDetails(true);

      const [documentsResult, kycResult] = await Promise.allSettled([
        fetchShopSubmittedDocuments(shopId),
        getUserKyc(),
      ]);

      if (documentsResult.status === "fulfilled") {
        setShopReviewDocuments(documentsResult.value);
      } else {
        toast.error("Không thể tải nhận xét hồ sơ pháp lý của shop");
      }

      if (kycResult.status === "fulfilled") {
        setUserKycReview(kycResult.value);
      } else {
        toast.error("Không thể tải nhận xét hồ sơ KYC");
      }

      setLoadingReviewDetails(false);
    };

    loadReviewDetails();
  }, [isRejectedRegistration, shopId]);

  const handleFileChange =
    (field: "identityFront" | "identityBack") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const asset = createUploadedAsset(file);

      setFiles((currentFiles) => {
        if (currentFiles[field]) {
          URL.revokeObjectURL(currentFiles[field].previewUrl);
        }

        return {
          ...currentFiles,
          [field]: asset,
        };
      });
    };

  const handleRequirementFileChange =
    (requirementId: string) => (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files ?? []);
      if (selectedFiles.length === 0) return;
      const assets = selectedFiles.map(createUploadedAsset);

      setFiles((currentFiles) => {
        currentFiles.requirements[requirementId]?.forEach((asset) =>
          URL.revokeObjectURL(asset.previewUrl),
        );

        return {
          ...currentFiles,
          requirements: {
            ...currentFiles.requirements,
            [requirementId]: assets,
          },
        };
      });
    };

  const handleSubmitStoreInfo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!form.storeName.trim()) {
      toast.error("Vui lòng nhập tên cửa hàng");
      return;
    }

    if (!form.taxCode.trim()) {
      toast.error("Vui lòng nhập mã số thuế");
      return;
    }

    const phone = form.phone.trim();
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại của shop");
      return;
    }

    if (phone.length < 8) {
      toast.error("Số điện thoại phải có ít nhất 8 ký tự");
      return;
    }

    if (form.categoryIds.length === 0) {
      toast.error("Vui lòng chọn ít nhất một danh mục");
      return;
    }

    setSubmitting(true);

    try {
      try {
        await createShop({
          shopName: form.storeName.trim(),
          registrationType: form.registrationType,
          taxCode: form.taxCode.trim(),
          phone,
          businessType: form.businessType,
          categoryIds: form.categoryIds,
        });
      } catch (error: unknown) {
        if (!isExistingShopError(error)) {
          throw error;
        }
      }

      const currentShop = normalizeMyShop(await getMyShop());
      const nextShopId = currentShop?.id || currentShop?.shopId;

      if (!nextShopId) {
        throw new Error("Không tìm thấy mã cửa hàng để nộp giấy tờ");
      }

      setShopId(String(nextShopId));
      setStep(2);
      navigate("/register", {
        replace: true,
        state: { initialStep: 2, shopId: String(nextShopId) },
      });
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Đăng ký cửa hàng thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDocuments = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    const missingRequirement = documentRequirements.find(
      (requirement) =>
        requirement.required &&
        (files.requirements[requirement.id]?.length ?? 0) === 0,
    );

    if (missingRequirement) {
      toast.error(`Vui lòng nộp ${missingRequirement.name}`);
      return;
    }

    if (!files.identityFront || !files.identityBack) {
      toast.error("Vui lòng nộp ảnh CCCD/CMND mặt trước và mặt sau");
      return;
    }

    if (!shopId) {
      toast.error("Không tìm thấy mã cửa hàng để nộp hồ sơ");
      return;
    }

    setSubmitting(true);

    try {
      const shopDocumentEntries = documentRequirements.flatMap((requirement) =>
        (files.requirements[requirement.id] ?? []).map((asset) => ({
          docType: requirement.code,
          file: asset.file,
        })),
      );

      if (shopDocumentEntries.length > 10) {
        toast.error("Chi duoc nop toi da 10 anh ho so phap ly shop");
        return;
      }

      if (shopDocumentEntries.length > 0) {
        try {
          await submitShopDocuments(shopId, {
            docTypes: shopDocumentEntries.map((entry) => entry.docType),
            files: shopDocumentEntries.map((entry) => entry.file),
          });
        } catch (error: unknown) {
          throw new Error(
            `Nộp hồ sơ pháp lý shop thất bại: ${getErrorMessage(
              error,
              "Lỗi không xác định",
            )}`,
            { cause: error },
          );
        }
      }

      try {
        await submitUserKyc({
          idType: form.identityType,
          front: files.identityFront.file,
          back: files.identityBack.file,
        });
      } catch (error: unknown) {
        throw new Error(
          `Nộp hồ sơ KYC thất bại: ${getErrorMessage(
            error,
            "Lỗi không xác định",
          )}`,
          { cause: error },
        );
      }

      setRegistrationStatus("pending_kyc");
      setStep(3);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Nộp hồ sơ đăng ký thất bại"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryRegistration = () => {
    revokeUploadedFiles(files);
    setFiles(initialUploadedFiles);
    setDocumentRequirements([]);
    setDocumentShopTypeName("");
    setRegistrationStatus("success");

    if (shopId) {
      setStep(2);
      navigate("/register", {
        replace: true,
        state: { initialStep: 2, shopId },
      });
      return;
    }

    setForm(initialRegistrationForm);
    setShopId("");
    setStep(1);
    navigate("/register", { replace: true, state: null });
  };

  return (
    <main className="seller-register-page">
      <ContextualHelpLink to="/help/seller/register-shop">Điều kiện mở Shop</ContextualHelpLink>
      {(checkingExistingShop ||
        (step === 1 && loadingCategories) ||
        loadingRequirements ||
        submitting) && <LoadingOverlay />}

      {isRejectedRegistration ? (
        <CompletionStep
          status={registrationStatus}
          onRetry={handleRetryRegistration}
          loadingReviewDetails={loadingReviewDetails}
          shopDocuments={shopReviewDocuments}
          userKyc={userKycReview}
        />
      ) : (
        <>
          <StepProgress step={step} completedSteps={completedSteps} />

          {step === 1 && (
            <StoreInfoStep
              form={form}
              setForm={setForm}
              categories={categories}
              loadingCategories={loadingCategories}
              submitting={submitting || checkingExistingShop}
              onSubmit={handleSubmitStoreInfo}
            />
          )}

          {step === 2 && (
            <VerificationStep
              form={form}
              files={files}
              setForm={setForm}
              onBack={() => setStep(1)}
              onFileChange={handleFileChange}
              onRequirementFileChange={handleRequirementFileChange}
              documentRequirements={documentRequirements}
              documentShopTypeName={documentShopTypeName}
              onSubmit={handleSubmitDocuments}
            />
          )}

          {step === 3 && (
            <CompletionStep
              status={registrationStatus}
              onRetry={handleRetryRegistration}
            />
          )}
        </>
      )}
    </main>
  );
}

function StepProgress({
  step,
  completedSteps,
}: {
  step: RegistrationStep;
  completedSteps: number[];
}) {
  return (
    <nav
      className={`seller-register-progress step-${step}`}
      aria-label="Tiến trình đăng ký"
    >
      {registrationSteps.map((item) => {
        const isComplete = completedSteps.includes(item.id);
        const isActive = step === item.id;

        return (
          <div
            key={item.id}
            className={`seller-register-step ${isActive ? "active" : ""} ${
              isComplete ? "complete" : ""
            }`}
          >
            <span className="seller-register-step-dot">
              {isComplete ? <Check size={16} /> : item.id}
            </span>
            <strong>{item.title}</strong>
          </div>
        );
      })}
    </nav>
  );
}
