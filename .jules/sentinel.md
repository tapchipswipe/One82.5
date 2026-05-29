## 2026-05-29 - [Insecure Randomness in Cryptographic Contexts]
**Vulnerability:** Predictable session tokens and session IDs generated using Math.random().
**Learning:** Math.random() is predictable and must never be used to generate secure values, such as authentication tokens or session identifiers. Even as a fallback, it creates a severe vulnerability.
**Prevention:** Always use cryptographically secure PRNGs like Web Crypto's crypto.getRandomValues() or crypto.randomUUID(). If a secure PRNG is not available in the environment, throw an error to fail securely rather than providing an insecure fallback.
