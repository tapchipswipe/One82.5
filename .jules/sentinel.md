## 2026-06-26 - Insecure Randomness in Session IDs
**Vulnerability:** `Math.random()` is used to generate session IDs and fallback session tokens in `api/_lib/backend.ts`. `Math.random()` is not cryptographically secure and can be predicted, leading to potential session hijacking vulnerabilities.
**Learning:** Security-sensitive identifiers, especially session tokens and IDs, must be generated using cryptographically secure pseudorandom number generators (CSPRNG) like `crypto.getRandomValues()` or `crypto.randomUUID()`.
**Prevention:** Always use `crypto.getRandomValues()` or `crypto.randomUUID()` when generating tokens, session IDs, or passwords. Avoid `Math.random()` for any security-related randomness.
