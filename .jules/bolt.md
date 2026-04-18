## 2024-04-18 - Replacing Multiple .reduce() Calls with a Single For Loop
**Learning:** In React components like `Profitability.tsx`, computing multiple summary totals using chained or repeated `.reduce()` calls on the same dataset creates multiple O(N) iterations. For large transaction portfolios, this causes unnecessary main thread CPU overhead and redundant array traversals.
**Action:** When calculating multiple aggregate metrics from a single array, use a single `for` loop to accumulate all totals simultaneously in a single O(N) pass, improving performance without sacrificing clarity.
