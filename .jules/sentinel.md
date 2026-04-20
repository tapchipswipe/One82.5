## 2024-05-24 - [Insecure Randomness in Security Contexts]
**Vulnerability:** Use of `Math.random()` for generating session tokens and backend session IDs (`api/_lib/backend.ts`).
**Learning:** `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG) and should never be used for security-critical values like session tokens, as it's predictable.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for generating security tokens, session IDs, or any value requiring unpredictability.
