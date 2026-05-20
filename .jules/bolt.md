## 2026-05-20 - Optimize multiple reduce operations
**Learning:** Multiple consecutive `.reduce()` operations over the same array to calculate totals in React component loops lead to redundant O(N) passes and decrease performance.
**Action:** Replace multiple consecutive `.reduce()` operations over the same dataset with a single `for` loop to accumulate all values simultaneously, avoiding redundant O(N) passes and improving performance.
