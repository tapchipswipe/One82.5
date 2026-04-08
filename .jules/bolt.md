## 2026-04-08 - Refactoring slice().reduce() array patterns for performance
**Learning:** The `slice().reduce()` array pattern allocates intermediate arrays before summing, creating overhead O(N) memory allocation and subsequent garbage collection overhead. This creates significant latency when rendering large portfolios.
**Action:** Replaced `slice().reduce()` calls in UI components with single-pass `for` loops with explicit boundary checks, thereby reducing processing time to ~O(1) memory overhead and maintaining application flow logic.
