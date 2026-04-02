## 2025-02-28 - Secure Session ID Generation
**Vulnerability:** Session identifiers (`sessionId` and `sessionToken`) in `api/_lib/backend.ts` were being generated using `Math.random()`, which is a predictable PRNG.
**Learning:** This exposes user sessions to potential hijacking if attackers can guess the PRNG sequence, compromising the application's overall security. Using `crypto.randomUUID()` provides cryptographically secure guarantees.
**Prevention:** Always use CSPRNGs (`node:crypto` in backend contexts, `window.crypto` in frontend) for secure identifiers such as session keys, database records, and audit logs.
