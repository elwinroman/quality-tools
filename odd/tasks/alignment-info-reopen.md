# Alignment info notice reopen

## Goal
Add an info action beside the authenticated sidebar username so the Alignment notice can be reopened manually, while automatically resetting its dismissal after four hours.

## Tasks
- [x] Extend dismissible notice state with four-hour expiry and a same-tab reopen signal.
- [x] Add the info action beside the sidebar username and connect it to the Alignment notice. The trigger is now available to authenticated and anonymous users.
- [x] Move the theme control to the shared sidebar footer for authenticated and anonymous users.
- [ ] Run frontend lint/build and commit the work unit. Validation is complete; commit remains pending explicit user authorization. Validation is complete; commit remains pending explicit user authorization.

## Scope
- `frontend/src/hooks/useDismissibleNotice.ts`
- `frontend/src/pages/Aligment/components/menu-sidebar/components/InfoCard.tsx`
- `frontend/src/components/sidebar/SidebarFooter.tsx`
- `frontend/src/components/shared/LoginUsername.tsx` (only if needed by the chosen placement)
- Relevant frontend tests/docs.

## Decisions
- The notice reappears automatically after four hours.
- The info action must reopen it manually without requiring a page refresh.
- The authenticated footer separates LoginUsername and the Info action with its existing `justify-between` layout.
- The theme control should live in the shared sidebar footer, not inside the account dropdown, and the Alignment Info action must be available to anonymous users.

## Evidence
- Focused tests: 12/12 passed.
- Frontend lint: passed.
- Frontend build: passed; existing Vite large-chunk advisory remains.
- Commit: pending explicit user authorization.
