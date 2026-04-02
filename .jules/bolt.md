## 2025-03-08 - [Optimize Array Slicing]
**Learning:** Replaced `.slice().reduce()` chains with single-pass `for` loops in hot data-aggregation paths (e.g., `buildPortfolioFromTransactions`, `volumeHistory`) to prevent unnecessary garbage collection overhead and intermediate array allocations.
**Action:** Use native loops with bounding logic over chained array operations for large data transformations in data-heavy views.
