
## 2026-06-21 - Avoid O(N log N) sort for Extremum Selection
**Learning:** Using `.sort((a, b) => b - a)[0] || null` on arrays to find the maximum or minimum element introduces unnecessary O(N log N) complexity, which can cause performance bottlenecks when arrays are large.
**Action:** Replace sorting with an O(N) manual loop that iterates through the array and tracks the latest maximum/minimum element. Fallback to `null` if the initial state remains unchanged.
