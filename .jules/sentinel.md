## 2026-07-06 - Secure Session Identifier Generation
**Vulnerability:** Predictable session identifiers using Math.random()
**Learning:** Using Math.random() for security-critical identifiers (like session tokens) can lead to predictable IDs, exposing the application to session hijacking vulnerabilities.
**Prevention:** Always use cryptographically secure random number generators (e.g., crypto.randomUUID() or crypto.getRandomValues()) for generating security-sensitive tokens, falling back safely without sacrificing entropy.
