## 2026-06-20 - Secure Session Identifier Generation
**Vulnerability:** Weak random number generation using Math.random() for session IDs and tokens.
**Learning:** Math.random() is predictable and unsuitable for generating security-sensitive values like session identifiers.
**Prevention:** Always use cryptographically secure random number generators like crypto.getRandomValues() or crypto.randomUUID() for authentication tokens and session identifiers.
