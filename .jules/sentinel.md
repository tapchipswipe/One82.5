## 2026-06-24 - Secure Session Token Generation
**Vulnerability:** The application was using `Math.random()` to generate session IDs and session tokens in `api/_lib/backend.ts`. `Math.random()` is not a cryptographically secure pseudo-random number generator (CSPRNG), making the tokens predictable and susceptible to hijacking.
**Learning:** Even internal backend session identifiers must be generated using cryptographically secure methods like `crypto.getRandomValues()` or `crypto.randomUUID()`.
**Prevention:** Always use the Web Crypto API or Node.js `crypto` module for generating sensitive random values, IDs, or tokens.
