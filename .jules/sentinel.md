## 2024-05-18 - [CRITICAL] Insecure Randomness in Authentication
**Vulnerability:** Used `Math.random()` to generate `sessionId` and `sessionToken` inside `api/_lib/backend.ts`.
**Learning:** `Math.random()` is not cryptographically secure, and the output sequence is predictable, which could be exploited by an attacker for session hijacking or user impersonation.
**Prevention:** Always use `crypto.randomUUID()` from `node:crypto` or `window.crypto.getRandomValues()` for any security-sensitive identifier generation, such as session IDs, API tokens, and temporary secrets.