## 2026-07-02 - Array map filter sort consolidation
**Learning:** Chained array methods (.map(), .filter(), .sort()) mask expensive O(N log N) and multiple O(N) iterations over the same datasets. They look elegant but waste memory on intermediate arrays and degrade performance exponentially on large items.
**Action:** Consolidate these sequences into a single O(N) loop manually tracking extrema without redundant allocation or sorting to enhance scalability on client devices.
