## 2024-05-24 - [Math.random used for Security Tokens]
**Vulnerability:** Weak random number generation using `Math.random` for sensitive identifiers (`sessionId` and `sessionToken`).
**Learning:** `Math.random` is predictable and deterministically seeded in some V8 engines, potentially allowing attackers to guess session tokens or IDs and impersonate users.
**Prevention:** Use cryptographically secure functions like `crypto.randomUUID()` or `crypto.getRandomValues()` to generate secure identifiers instead.
