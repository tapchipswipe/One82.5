## 2026-06-28 - Insecure Randomness in Auth Tokens
**Vulnerability:** The application used Math.random() to generate session IDs and session tokens in api/_lib/backend.ts, which is predictable and insecure.
**Learning:** In Node/edge environments, always use crypto.getRandomValues (or crypto.randomUUID) rather than Math.random() when generating authentication secrets, while maintaining fallback support if crypto is globally undefined.
**Prevention:** Ensure new tokens use securely generated entropy (e.g. mapping Uint8Array to characters) rather than relying on pseudo-random generators designed for non-security use cases.
