## 2026-07-04 - Prevent Mass Assignment in User Profile Update
**Vulnerability:** The profile update endpoint (`app/api/_legacy/handlers/auth/profile.ts`) merged the entire `incoming` user payload into `auth.user` using the spread operator (`...incoming`).
**Learning:** This allowed users to arbitrarily overwrite restricted fields like `role`, `credits`, or `plan` (Privilege Escalation).
**Prevention:** Always explicitly cherry-pick only the allowed, user-modifiable fields from incoming API payloads instead of using blind object spreading.
