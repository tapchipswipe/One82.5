## 2026-07-03 - [CRITICAL] Fix insecure PRNG for session identifiers
**Vulnerability:** Insecure PRNG (`Math.random()`) used for generating session IDs and session tokens in `api/_lib/backend.ts`.
**Learning:** `Math.random()` generates predictable values. Using it for sensitive identifiers like session tokens makes them susceptible to prediction, allowing attackers to hijack sessions.
**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNG) like `crypto.randomUUID()` or `crypto.getRandomValues()` for security-sensitive tokens, passwords, and identifiers.
