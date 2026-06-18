## 2026-06-18 - Array Sort for Extremum Value Tracking
**Learning:** Found instances where arrays are mapped, filtered, and fully sorted (O(N log N)) just to find the maximum or minimum value (e.g., using `.sort()[0] || null`). This pattern is slow and memory-intensive for large datasets.
**Action:** When finding a max/min value, replace the `.sort()` chain with a single O(N) iterative loop to track the extremum value, significantly reducing execution time.
