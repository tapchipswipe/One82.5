## 2025-05-27 - Multiple reduce optimizations
**Learning:** Chaining `.reduce()` operations over the same array is a frequent anti-pattern for performance when extracting aggregates in React component memos, causing redundant O(N) loops.
**Action:** Consolidate subsequent aggregates into a single iterative `for` loop to compute all sums concurrently during a single pass.
