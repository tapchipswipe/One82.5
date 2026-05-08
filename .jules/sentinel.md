## 2024-05-24 - [Fix Predictable Session Token Generation]
**Vulnerability:** Predictable session identifiers generated using Math.random() in `api/_lib/backend.ts`.
**Learning:** Using `Math.random()` for cryptographic purposes like session tokens makes them susceptible to prediction, allowing potential session hijacking.
**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNG) like Web Crypto API's `crypto.randomUUID()` or `crypto.getRandomValues()` for security-critical values. If unavailable, the application should fail securely rather than falling back to an insecure method.
