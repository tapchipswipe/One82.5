## 2025-02-28 - Insecure Randomness in Session IDs

**Vulnerability:** `Math.random()` and `Date.now()` were used to generate backend session tokens and IDs in `api/_lib/backend.ts`. This combination is predictable and cryptographically insecure, risking session hijacking.
**Learning:** Security-critical identifiers like session tokens must always rely on cryptographic pseudo-random number generators (CSPRNG). If secure generation methods are unavailable, the system should fail securely (e.g., throwing an error) rather than silently falling back to insecure methods.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for secure tokens. Implement strict capability checks and throw errors if the environment lacks CSPRNG support, preventing insecure fallbacks.
