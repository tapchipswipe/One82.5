## 2026-06-05 - [Predictable Session Identifier Vulnerability]
**Vulnerability:** Use of Math.random() as a fallback for generating session cookies and authentication tokens.
**Learning:** Deterministic functions like Math.random() can be predicted. When used for secure identifiers, it enables session hijacking vulnerabilities. In environments where Web Crypto API is not fully supported, throwing an error is significantly safer than failing open to an insecure implementation.
**Prevention:** Always use crypto.randomUUID() or crypto.getRandomValues() for authentication mechanisms.
