## 2024-05-02 - Insecure Session Token Generation
**Vulnerability:** Use of `Date.now()` and `Math.random()` as a fallback for generating cryptographic session tokens in `api/_lib/backend.ts`.
**Learning:** Never use deterministic, time-based values like `Date.now()` or `Math.random()` for cryptographic randomness (e.g., session tokens). It introduces severe prediction vulnerabilities.
**Prevention:** Use `crypto.getRandomValues()` or `crypto.randomUUID()`. If secure randomness is unavailable in the environment, throw an error to fail securely rather than using an insecure fallback.