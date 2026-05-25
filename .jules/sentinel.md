## 2026-05-25 - [Insecure Randomness in Auth]
**Vulnerability:** Use of `Math.random()` to generate `sessionId` and `sessionToken` in `api/_lib/backend.ts` authentication flows.
**Learning:** `Math.random()` provides weak, predictable randomness and should not be used in security-critical contexts like generating session identifiers.
**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNG), such as `crypto.randomUUID()` or `crypto.getRandomValues()`, for any tokens, identifiers, or keys utilized in authentication and authorization contexts.
