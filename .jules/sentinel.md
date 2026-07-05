## 2026-07-05 - Insecure Session Token Generation
**Vulnerability:** The `createCookieSession` and `createSessionToken` functions in `api/_lib/backend.ts` fallback to using `Math.random()` to generate tokens or session IDs. This provides very low entropy and is predictable.
**Learning:** Hardcoded predictable random functions should never be used to generate secure or sensitive tokens.
**Prevention:** Use cryptographically secure methods like `crypto.getRandomValues` for token or session generation.
