## 2025-02-27 - Fix Weak Random Number Generation for Session Tokens
**Vulnerability:** The application was using `Math.random()` to generate backend session IDs and tokens in `api/_lib/backend.ts`.
**Learning:** `Math.random()` is not a Cryptographically Secure Pseudo-Random Number Generator (CSPRNG), which makes generated tokens predictable and vulnerable to session hijacking and brute-force attacks.
**Prevention:** Always use `node:crypto`'s `randomUUID()` or `randomBytes()` for generating security-sensitive tokens, IDs, or keys in Node.js backend environments.
