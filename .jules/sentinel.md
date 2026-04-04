## 2024-05-24 - Secure Session Token Generation
**Vulnerability:** Weak randomness (`Math.random()`) was being used to generate sensitive session tokens (`sessionId`, `session_token`), making them predictable and vulnerable to session hijacking.
**Learning:** `api/_lib/backend.ts` had several instances of `Math.random` that were meant for unique ID generation, including for security tokens.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` from `node:crypto` or `window.crypto` (in the browser) when generating IDs or tokens that require cryptographic security, instead of `Math.random()`.
