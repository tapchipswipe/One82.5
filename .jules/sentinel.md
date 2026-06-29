## 2026-06-29 - Secure Random Number Generation
**Vulnerability:** Weak PRNG (`Math.random()`) was used to generate session tokens and session IDs in `api/_lib/backend.ts`.
**Learning:** `crypto.randomUUID()` may not be available in all runtime environments, so the fallback safely needs to try `crypto.getRandomValues()` before falling back to `Math.random()`. Generating a `Uint8Array` and encoding it is a robust alternative.
**Prevention:** Avoid relying solely on `Math.random()` for tokens. Always prefer `crypto` APIs and handle their absence gracefully by falling back to `getRandomValues` if `randomUUID` is unavailable.
