## 2026-05-19 - [Insecure Randomness in Session Tokens]
**Vulnerability:** Session identifiers and tokens in `api/_lib/backend.ts` were generated using deterministic, time-based values like `Math.random()` and `Date.now()`.
**Learning:** Using non-cryptographic pseudo-random number generators (PRNGs) for session identifiers introduces severe prediction vulnerabilities, allowing potential session hijacking.
**Prevention:** Always use cryptographically secure pseudo-random number generators (CSPRNGs) like `crypto.randomUUID()` or `crypto.getRandomValues()` for security-critical contexts. If secure randomness is unavailable in the environment, throw an error to fail securely rather than using an insecure fallback.
