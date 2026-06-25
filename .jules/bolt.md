## 2026-06-25 - O(N log N) sorting for Extremum Finding
**Learning:** Using `.sort()[0] || null` to find maximum/minimum values introduces unnecessary O(N log N) complexity, especially costly when chained with `.map()` and `.filter()`. React component memoization can hide these inefficient data transformations during renders.
**Action:** Always use a single O(N) loop with an explicit fallback tracker (e.g., `let latest: number | null = -Infinity`) to consolidate operations and avoid redundant array methods.
