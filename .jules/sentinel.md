## 2025-03-09 - [Insecure Randomness in Session Tokens]
**Vulnerability:** The backend generates sensitive `sessionId` and session tokens using deterministic and predictable `Math.random()`.
**Learning:** This could allow an attacker to predict valid session identifiers, leading to session hijacking. The Web Crypto API or `node:crypto` should always be used for secure generation.
**Prevention:** Always use `crypto.randomUUID()` or `crypto.getRandomValues()` for generating secrets, tokens, or IDs used in an authentication or security context.
