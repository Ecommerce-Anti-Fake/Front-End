import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { toast } from "sonner";
import "../../css/pages/profile/userProfile.css";
import { updateUserProfile, uploadUserAvatar } from "../../services/user.api";
import { getUser, saveUser } from "../../ultil/auth";
import { useGlobalLoadingStore } from "../../store/globalLoadingStore";

type ProfileForm = {
  displayName: string;
  fullName: string;
  email: string;
  phone: string;
  avatar: string;
};

const defaultAvatar =
  "https://api.dicebear.com/9.x/initials/svg?seed=AntiFake&backgroundColor=f4e5e5";

type JsonRecord = Record<string, unknown>;

const asRecord = (value: unknown): JsonRecord => (
  value !== null && typeof value === "object" ? value as JsonRecord : {}
);

const getResponseData = (data: unknown): JsonRecord => {
  const root = asRecord(data);
  if (root.user && typeof root.user === "object") return asRecord(root.user);
  if (root.data && typeof root.data === "object") return asRecord(root.data);
  return root;
};

const getString = (data: JsonRecord, key: string): string | undefined => (
  typeof data[key] === "string" ? data[key] : undefined
);

const getAvatarUrl = (data: unknown): string | undefined => {
  const payload = getResponseData(data);
  const root = asRecord(data);
  return getString(payload, "avatar")
    ?? getString(payload, "avatarUrl")
    ?? getString(payload, "url")
    ?? getString(root, "avatar")
    ?? getString(root, "avatarUrl")
    ?? getString(root, "url");
};

export default function UserProfile() {
  const user = getUser();
  const initialProfile: ProfileForm = {
    displayName: user?.displayName || user?.fullName || "Người dùng",
    fullName: user?.fullName || user?.displayName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || defaultAvatar,
  };

  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [form, setForm] = useState<ProfileForm>(initialProfile);
  const [openEditProfile, setOpenEditProfile] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const showLoading = useGlobalLoadingStore((state) => state.showLoading);
  const hideLoading = useGlobalLoadingStore((state) => state.hideLoading);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const openProfileModal = () => {
    setForm(profile);
    setAvatarError("");
    setAvatarFile(null);
    setOpenEditProfile(true);
  };

  const closeProfileModal = () => {
    if (saving) return;

    setOpenEditProfile(false);
    setAvatarError("");
    setAvatarFile(null);
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      setAvatarError("Dung lượng file tối đa 1MB");
      setAvatarFile(null);
      event.target.value = "";
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setAvatarError("Chỉ hỗ trợ ảnh JPEG hoặc PNG");
      setAvatarFile(null);
      event.target.value = "";
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = () => {
      setForm((currentForm) => ({
        ...currentForm,
        avatar: String(reader.result),
      }));
      setAvatarError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving) return;

    const nextDisplayName = form.fullName.trim() || form.displayName.trim();

    setSaving(true);
    showLoading("Đang lưu hồ sơ...");

    try {
      const profileResponse = await updateUserProfile({
        displayName: nextDisplayName,
        phone: form.phone.trim(),
      });
      const profileData = getResponseData(profileResponse);

      let nextAvatar = getString(profileData, "avatar") || form.avatar;

      if (avatarFile) {
        const avatarResponse = await uploadUserAvatar(avatarFile);
        nextAvatar = getAvatarUrl(avatarResponse) || nextAvatar;
      }

      const nextProfile: ProfileForm = {
        displayName: getString(profileData, "displayName") || nextDisplayName,
        fullName: getString(profileData, "fullName")
          || getString(profileData, "displayName")
          || nextDisplayName,
        email: getString(profileData, "email") || form.email,
        phone: getString(profileData, "phone") || form.phone.trim(),
        avatar: nextAvatar,
      };

      const nextUser = {
        ...user,
        ...profileData,
        displayName: nextProfile.displayName,
        fullName: nextProfile.fullName,
        email: nextProfile.email,
        phone: nextProfile.phone,
        avatar: nextProfile.avatar,
      };

      setProfile(nextProfile);
      setForm(nextProfile);
      saveUser(nextUser);
      setAvatarFile(null);
      closeProfileModal();
      toast.success("Cập nhật hồ sơ thành công");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Cập nhật hồ sơ thất bại");
    } finally {
      setSaving(false);
      hideLoading();
    }
  };

  return (
    <>
      <div className="profile-card">
        <div className="profile-header">
          <h2>Hồ sơ cá nhân</h2>
          <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
        </div>

        <div className="profile-body">
          <div className="profile-info">
            <div className="profile-item">
              <span className="profile-label">Tên tài khoản</span>
              <span>{profile.displayName}</span>
            </div>

            <div className="profile-item">
              <span className="profile-label">Họ và tên</span>
              <span>{profile.fullName || profile.displayName}</span>
            </div>

            <div className="profile-item">
              <span className="profile-label">Email</span>
              <span>{profile.email}</span>
            </div>

            <div className="profile-item">
              <span className="profile-label">Số điện thoại</span>
              <span>{profile.phone}</span>
            </div>

            <button
              type="button"
              className="profile-edit-btn"
              onClick={openProfileModal}
            >
              Chỉnh sửa hồ sơ
            </button>
          </div>

          <div className="profile-avatar-section">
            <img
              src={profile.avatar}
              alt={profile.fullName || profile.displayName}
              className="profile-avatar"
            />
          </div>
        </div>
      </div>

      {openEditProfile && (
        <div
          className="profile-edit-overlay"
          role="presentation"
          onClick={closeProfileModal}
        >
          <form
            className="profile-edit-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-edit-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleSaveProfile}
          >
            <div className="profile-edit-header">
              <div>
                <h2 id="profile-edit-title">Hồ sơ cá nhân</h2>
                <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
              </div>

              <button
                type="button"
                className="profile-edit-close"
                aria-label="Đóng chỉnh sửa hồ sơ"
                onClick={closeProfileModal}
                disabled={saving}
              >
                x
              </button>
            </div>

            <div className="profile-edit-content">
              <div className="profile-edit-fields">
                <div className="profile-edit-row readonly">
                  <label>Tên tài khoản</label>
                  <strong>{profile.displayName}</strong>
                </div>

                <div className="profile-edit-row">
                  <label htmlFor="profile-full-name">Họ và tên</label>
                  <input
                    id="profile-full-name"
                    value={form.fullName}
                    disabled={saving}
                    onChange={(event) =>
                      setForm({ ...form, fullName: event.target.value })
                    }
                  />
                </div>

                <div className="profile-edit-row">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    id="profile-email"
                    type="email"
                    value={form.email}
                    readOnly
                  />
                  <button type="button" disabled={saving}>
                    Thay đổi
                  </button>
                </div>

                <div className="profile-edit-row">
                  <label htmlFor="profile-phone">Số điện thoại</label>
                  <input
                    id="profile-phone"
                    value={form.phone}
                    disabled={saving}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                  />
                  <button type="button" disabled={saving}>
                    Thay đổi
                  </button>
                </div>

                <button
                  type="submit"
                  className="profile-save-btn"
                  disabled={saving}
                >
                  {saving ? "Đang lưu..." : "Lưu"}
                </button>
              </div>

              <div className="profile-edit-avatar-panel">
                <img
                  src={form.avatar}
                  alt={form.fullName || form.displayName}
                  className="profile-edit-avatar"
                />

                <label className="profile-avatar-upload">
                  Chọn ảnh
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    disabled={saving}
                    onChange={handleAvatarChange}
                  />
                </label>

                <p>Dung lượng file tối đa 1MB</p>
                <p>Định dạng: JPEG, PNG</p>

                {avatarError && (
                  <span className="profile-avatar-error">{avatarError}</span>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
