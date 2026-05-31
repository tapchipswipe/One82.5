## 2026-05-31 - Secure Randomness for Session Tokens
**Vulnerability:** Session identifiers and tokens were being generated using `Math.random()` and `Date.now()`.
**Learning:** Using deterministic, time-based, or weak random values for cryptographic purposes like session management introduces severe prediction vulnerabilities.
**Prevention:** Always use secure randomness APIs like `crypto.randomUUID()` or `crypto.getRandomValues()` for security-critical identifiers. If secure randomness is unavailable, throw an error to fail securely rather than falling back to an insecure method.
