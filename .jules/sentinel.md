## 2026-07-07 - Prevent Predictable Session Identifiers
**Vulnerability:** Weak PRNG (`Math.random()`) was used as a fallback for generating session IDs and session tokens (`backend_session_...` and `st_...`), leading to predictable session identifiers (CWE-338).
**Learning:** Even as a fallback, `Math.random()` lacks the cryptographic entropy required for secure tokens. Predictability enables session hijacking.
**Prevention:** Use `crypto.getRandomValues()` with a typed array to securely generate fallback entropy when `crypto.randomUUID()` is unavailable.
