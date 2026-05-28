## 2026-05-28 - Prevent Weak Cryptographic Randomness for Session Tokens
**Vulnerability:** Deterministic `Math.random()` and `Date.now()` were used as fallbacks for generating session IDs and tokens in `api/_lib/backend.ts`. This introduces a severe prediction vulnerability allowing attackers to guess valid session identifiers.
**Learning:** In environment-agnostic code, developers often add insecure fallbacks for randomness if `crypto` is undefined, inadvertently weakening security for critical components.
**Prevention:** Never use deterministic values for security-critical randomness. Fail securely by throwing an explicit error if `crypto.randomUUID()` or `crypto.getRandomValues()` is unavailable, rather than silently degrading to `Math.random()`.
