## 2026-06-07 - Prevent Insecure Randomness Fallback

**Vulnerability:** Predictable session IDs generated via `Math.random()` and `Date.now()` fallbacks in `api/_lib/backend.ts`.
**Learning:** The codebase attempted to support environments lacking Web Crypto by silently degrading security for session management instead of failing safely.
**Prevention:** Always fail securely. If a critical cryptographic operation lacks secure randomness, throw an error rather than using deterministic fallbacks like `Math.random()`.
