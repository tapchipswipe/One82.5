## 2026-05-15 - Prevent weak randomness in session tokens
**Vulnerability:** Found `Math.random()` used as a fallback for generating `sessionId` and `sessionToken` in backend authentication if `crypto.randomUUID` is unavailable.
**Learning:** Using `Math.random()` for cryptographic purposes like session identifiers introduces prediction vulnerabilities. The system must fail securely by throwing an error rather than creating an insecure session.
**Prevention:** Never fallback to weak randomness (`Math.random()`) when `crypto` is unavailable for security-critical contexts. Explicitly check for secure capabilities and throw an error to fail securely if missing.
