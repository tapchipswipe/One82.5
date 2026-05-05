## 2024-05-05 - Insecure Fallback for Session Token Generation
**Vulnerability:** Weak randomness used as a fallback for generating sensitive session tokens (`sessionId`, `SESSION_COOKIE`) when `crypto.randomUUID()` is considered unavailable, relying on `Math.random()` and `Date.now()`.
**Learning:** Hardcoding a fallback to a deterministic and predictable random number generator (`Math.random`) for sensitive contexts opens up significant prediction vulnerabilities.
**Prevention:** Always fail securely by throwing an error when cryptographically secure random number generators (CSPRNG) are unavailable. Never fall back to insecure PRNGs for security-critical contexts like session token generation.
