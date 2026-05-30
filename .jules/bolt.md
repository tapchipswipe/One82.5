## 2026-05-30 - Consolidating redundant array iterations
**Learning:** Component metrics aggregation often uses chained array methods (.filter, .map) and multiple .reduce() calls on the same datasets, which leads to redundant O(N) operations.
**Action:** Consolidate multiple chained iterations over arrays into a single for loop to accumulate all required values simultaneously.
