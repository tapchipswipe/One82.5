## 2025-04-15 - Predictable Session IDs via Math.random()
**Vulnerability:** The backend session generator in `api/_lib/backend.ts` used `Math.random()` and `Date.now()` as a fallback when generating session IDs and session tokens. This creates highly predictable tokens which could allow an attacker to hijack or forge sessions.
**Learning:** Security fallbacks must never degrade to insecure randomness for cryptographic or session-related tokens.
**Prevention:** Always mandate secure randomness (e.g., `crypto.randomUUID()` or `crypto.getRandomValues()`). If the environment cannot provide secure randomness, the application must throw an explicit error and fail securely rather than introducing weak fallback mechanisms.
