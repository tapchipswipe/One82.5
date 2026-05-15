## 2026-05-15 - Consolidating O(N) array passes and avoiding Math.max on large arrays
**Learning:** Multiple array operations (`.map()`, `.filter()`, `.reduce()`, `.sort()`) over the same dataset create significant bottlenecks, and spreading an array (`Math.max(...array)`) causes `RangeError` stack overflows on large datasets.
**Action:** Replace multiple consecutive iterations with a single `for` loop to accumulate values, and find `max`/`min` within the loop instead of using spread operators.
