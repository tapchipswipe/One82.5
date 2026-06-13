## 2026-06-13 - Fix Authorization Bypass in Profile API
**Vulnerability:** The PUT /api/auth/profile endpoint merged all user-provided fields into the saved user object, allowing users to modify sensitive attributes like `role`, `credits`, and `plan`.
**Learning:** Using the spread operator (`...incoming`) over user-provided data directly onto the domain object bypasses authorization controls and allows privilege escalation.
**Prevention:** Explicitly map only the allowed user-editable fields from the incoming payload and preserve the sensitive properties from the authenticated session context.
