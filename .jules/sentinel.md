## 2026-05-30 - Insecure Randomness in Session Generation
**Vulnerability:** Weak deterministic randomness (`Math.random()`) was used for creating critical security tokens (`sessionId`, `createSessionToken`).
**Learning:** Secure functions must fail securely if required primitives (like `crypto.randomUUID`) are absent, rather than degrading to exploitable patterns like `Math.random()`.
**Prevention:** Always use cryptographic randomness (`crypto.randomUUID` or `crypto.getRandomValues`) for session and auth tokens and explicitly throw errors when unavailable.
