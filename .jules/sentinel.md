## 2026-04-05 - Fix Insecure Randomness in API
**Vulnerability:** The backend session ID and token generation logic (`api/_lib/backend.ts`) relied on `Math.random()`, which is a predictable pseudorandom number generator (PRNG) and not cryptographically secure. This could lead to session hijacking.
**Learning:** Even internal backend session identifiers must be generated securely. `Math.random()` should never be used for security-sensitive tokens, UUIDs, or passwords.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` when generating tokens, identifiers, or other security artifacts.
