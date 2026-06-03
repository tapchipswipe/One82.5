## 2026-06-03 - [Insecure Randomness for Critical Session IDs]
**Vulnerability:** The application was using `Math.random().toString(36).slice(2, 8)` to generate session tokens and IDs for various entities, including sensitive authentication tokens. This makes session tokens predictable, leading to potential account takeover vulnerabilities.
**Learning:** Even internal testing or demo applications shouldn't use weak random functions for security-sensitive logic like tokens or IDs, because it normalizes insecure patterns and creates vulnerabilities in production.
**Prevention:** Use cryptographically secure random number generators (CSPRNGs) like `crypto.randomUUID()` or `crypto.getRandomValues()` for generating all IDs, especially authentication tokens.
