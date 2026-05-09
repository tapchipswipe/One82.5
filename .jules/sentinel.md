## 2024-05-09 - Insecure Session Generation using Math.random()
**Vulnerability:** Core session IDs and tokens in backend.ts were using predictable Date.now() + Math.random() combinations instead of CSPRNGs.
**Learning:** Security-critical functions like session generation must never silently degrade to weak PRNGs. It is better to fail securely and loudly than to issue a predictable, compromisable session token.
**Prevention:** Enforce use of (crypto as any).randomUUID() or crypto.getRandomValues() for all session/auth tokens. If unavailable, explicitly throw an Error rather than providing an insecure fallback.
