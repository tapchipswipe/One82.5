## 2026-06-10 - [Secure Session Identifiers]
**Vulnerability:** Weak randomness using `Math.random()` for generating session IDs and session tokens in backend authentication.
**Learning:** Deterministic, time-based values and `Math.random()` introduce prediction vulnerabilities and are not secure for cryptographic tokens.
**Prevention:** Always use Web Crypto API (`crypto.randomUUID` or `crypto.getRandomValues`) for generating session tokens and fail securely (throw an error) if a secure random source is unavailable.
