## 2024-05-18 - Insecure Session Token Generation
**Vulnerability:** Deterministic `Math.random()` usage for session tokens (`sessionId`, `createSessionToken`) in `api/_lib/backend.ts`.
**Learning:** `Math.random()` provides predictable pseudorandom outputs making session identifiers vulnerable to hijacking or prediction attacks. Fallbacks for environments lacking specific API variants (`randomUUID`) must still utilize strong cryptographic randomness (`getRandomValues`).
**Prevention:** Enforce the use of `crypto.randomUUID()` or `crypto.getRandomValues()` when generating identifiers used for authentication, authorization, or session management. Explicitly fail and throw errors if cryptographic functions are unavailable instead of failing open with `Math.random()`.
