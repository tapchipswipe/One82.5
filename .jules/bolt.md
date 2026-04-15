## 2024-04-15 - [Avoid .slice().reduce() in array segments]
**Learning:** Using `.slice().reduce()` inside loops or for large datasets creates O(N) intermediate array allocations, causing unnecessary GC pressure and CPU cycles.
**Action:** Replace array segment calculations with a single-pass `for` loop, updating accumulators directly and including explicit boundary checks (e.g., `i < array.length`).
