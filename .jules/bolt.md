## 2026-06-19 - Expensive chained operations for extremum finding
**Learning:** The codebase frequently uses chained array operations (`.map`, `.filter`, `.sort`) to find maximum timestamps, such as `.sort((a, b) => b - a)[0] || null`. This introduces unnecessary memory allocation and an O(N log N) time complexity for an operation that can be done in O(N).
**Action:** When finding max/min values, avoid chained operations and use a single O(N) loop to track the extremum value, especially in performance-sensitive frontend components like Dashboard.
