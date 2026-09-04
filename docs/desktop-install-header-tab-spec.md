# Spec: Desktop PWA install header tab

## Objective

Expose the existing `/install` PWA guidance page from the primary desktop header
while preserving the existing mobile install entry and mobile bottom navigation.

## Scope and implementation

- Reuse `usePwaInstalledStatus()` from the existing PWA installation flow.
- Render a `Cài đặt` desktop menu link immediately after `Trợ giúp` only when
  the PWA is not installed.
- Keep the link inside the existing desktop menu so the current `max-width: 820px`
  mobile breakpoint continues to hide it without adding it to mobile navigation.
- Use the existing menu link styles and exact-path active state for `/install`.

## Testing strategy

- Playwright regression coverage for uninstalled/installed desktop states, route
  navigation, active styling, desktop viewport overflow, and mobile preservation.
- Existing PWA unit tests and mobile install-entry coverage remain green.
- Validate with the relevant E2E test, full test/build/lint checks, and production
  browser verification after deployment.

## Success criteria

- At 1024, 1280, 1440, and 1920px widths, an uninstalled desktop sees `Cài đặt`
  beside `Trợ giúp`, and the header has no horizontal overflow.
- Clicking the tab navigates to `/install`, where the tab is active.
- An installed PWA sees no desktop `Cài đặt` tab.
- At mobile/tablet widths covered by the existing breakpoint, the desktop tab is
  absent and the current mobile install entry remains unchanged.

## Boundaries

- Always: preserve `/install`, the existing PWA status logic, mobile bottom
  navigation, and current header styles.
- Never: add a second mobile navigation item, change PWA detection semantics, or
  modify unrelated backend/UAT work.
