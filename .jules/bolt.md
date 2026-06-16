
## 2026-06-16 - Extremum Value Chaining Anti-Pattern
**Learning:** Chaining `.map()`, `.filter()`, and `.sort()[0]` to find a minimum or maximum value introduces an unnecessary O(N log N) overhead and excessive memory allocation.
**Action:** Replace this pattern with a single O(N) iteration that tracks the extremum value (e.g., `let latest = null; for (const item of list) { ... }`).
