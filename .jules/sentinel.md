## 2025-02-14 - Replace Insecure Math.random with crypto.randomUUID
**Vulnerability:** Found `Math.random()` and `Date.now()` being used to securely generate session IDs and session tokens in `api/_lib/backend.ts`. This allowed predictable generation of sensitive authentication IDs.
**Learning:** Hardcoded, random-looking but deterministic string generators were implemented instead of standard CSRNG.
**Prevention:** Always use `crypto.randomUUID()` or cryptographic alternatives for secure session generation. Fail securely if `crypto` functions are unavailable to prevent fallback behavior.
