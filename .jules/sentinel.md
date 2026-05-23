## 2026-05-23 - Weak Session ID Generation
**Vulnerability:** Predictable session IDs generated using Math.random() and Date.now().
**Learning:** Math.random() is predictable and unsafe for creating session tokens or IDs that require cryptographic randomness, as it introduces severe prediction vulnerabilities.
**Prevention:** Use crypto.randomUUID() or crypto.getRandomValues() to generate unguessable identifiers for session tokens. If secure randomness is unavailable, throw an error to fail securely rather than using an insecure fallback.
