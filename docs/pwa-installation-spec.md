# Spec: Cài đặt AntiFake dưới dạng PWA

## Objective

Bổ sung khả năng cài Front-End hiện tại như một Progressive Web App trên Chrome/Edge desktop, Android và Safari iOS/iPadOS, trong khi website và toàn bộ API/auth hiện tại tiếp tục hoạt động bình thường.

## Tech Stack

- React 19, React Router 7, TypeScript, Vite 8.
- `vite-plugin-pwa` với Workbox `generateSW`, `registerType: "autoUpdate"`.
- Manifest và icon tái sử dụng nhận diện AntiFake hiện có.

## Commands

- Build/typecheck: `npm run build`
- Lint: `npm run lint`
- PWA unit tests: `npm run test:pwa`
- PWA browser tests: `npm run test:e2e -- e2e/pwa-settings.spec.ts`
- Local production preview: `npm run preview -- --host 127.0.0.1`

## Project Structure

- `vite.config.ts`: manifest, service worker và chính sách cache.
- `src/services/pwa-install.ts`: feature/platform detection thuần, có unit test.
- `src/hooks/usePwaInstall.ts`: vòng đời `beforeinstallprompt`, `appinstalled`, standalone.
- `src/pages/profile/settingsPage.tsx`: trang cài đặt hiện hữu, không tạo route trùng.
- `src/css/pages/profile/settingsPage.css`: giao diện responsive theo màu AntiFake.
- `public/pwa/`: icon và ảnh minh họa hướng dẫn.
- `test/`, `e2e/`: unit và browser coverage tập trung.

## Code Style

```ts
const standalone =
  window.matchMedia("(display-mode: standalone)").matches ||
  navigator.standalone === true;
```

Ưu tiên feature detection; user-agent chỉ phân biệt iOS/iPadOS và browser để chọn hướng dẫn. Component dùng semantic HTML, nút thật và trạng thái có `aria-live`.

## Testing Strategy

- Unit: desktop/Android/iOS/iPadOS, Chrome/Edge/Safari, standalone và trạng thái CTA.
- E2E: route Settings, tab hướng dẫn, iOS fallback, responsive/overflow.
- Build output: có manifest, service worker, icon và không có runtime cache cho API/private data.
- Manual/device: native install prompt và standalone phải được xác nhận trên thiết bị/browser thật sau deploy HTTPS.

## Boundaries

- Always: giữ route `/profile/settings`, giữ auth/cookie hiện tại, cache chỉ app shell/static assets.
- Ask first: thay đổi domain, cookie policy, backend contract hoặc cơ chế lưu token.
- Never: cache API/private data, lưu refresh token/password ở client, tự bật install prompt, tạo native package.

## Success Criteria

- Manifest hợp lệ với tên AntiFake, `display: standalone`, icon 192/512/maskable/apple touch.
- CTA chỉ gọi prompt sau thao tác người dùng; ẩn khi standalone/installed; iOS hiển thị hướng dẫn Safari.
- Trang có tabs Máy tính/Android/iPhone-iPad, bước đánh số và ảnh minh họa, không overflow ngang.
- `ProtectedRoute` thử refresh session hiện hữu trước khi chuyển Login khi access token vắng.
- Website không cài vẫn hoạt động; build, lint và test liên quan đều qua.

## Open Questions

Không có. Yêu cầu người dùng đã xác định rõ phạm vi, route hiện hữu và hành vi mong muốn.
