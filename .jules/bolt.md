## 2026-04-21 - Optimize Profitability Component Reducers
**Learning:** Found multiple consecutive `.reduce()` array iterations that loop over the same array to calculate distinct sums. Also observed `slice().reduce()` chains that allocate intermediate arrays.
**Action:** Replaced multiple consecutive `.reduce()` iterations and `slice().reduce()` allocations with single-pass `for` loops. This prevents redundant O(N) array passes and intermediate array allocations, significantly improving performance without sacrificing readability when properly commented.
