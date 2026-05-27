## 2026-05-27 - Insecure Randomness in Session Tokens
**Vulnerability:** Weak deterministic randomness (`Math.random()` and `Date.now()`) was used to generate session tokens, creating severe prediction vulnerabilities and potential session hijacking risks.
**Learning:** Security-critical identifiers like session tokens must rely exclusively on cryptographically secure pseudorandom number generators (CSPRNG).
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for generating security tokens, and enforce a secure failure state if they are unavailable in the environment.
