## 2024-05-24 - [Fix PRNG Fallback in Session Tokens]
**Vulnerability:** Weak, predictable random number generators (`Math.random()` and `Date.now()`) were used as fallbacks for generating session IDs and session tokens in `api/_lib/backend.ts`. This makes session tokens predictable and vulnerable to hijacking.
**Learning:** Security functions (like session generation) must never fall back to insecure PRNGs in case of environment limitations. Instead, they should fail fast securely if CSPRNG is unavailable.
**Prevention:** Remove all fallback paths to weak PRNGs for security-critical values (like session IDs). Throw an error if secure random functions like `crypto.randomUUID()` or `crypto.getRandomValues()` are not supported in the execution environment.
