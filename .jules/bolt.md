## 2026-07-04 - [Replace O(N log N) extremum extraction with O(N) fallback loop]
**Learning:** Avoid using `.sort()[0] || null` to extract the maximum or minimum value in an array. It adds an unnecessary O(N log N) sorting overhead when an O(N) iteration can find the extremum faster with zero allocations.
**Action:** Always replace `.sort()[0] || null` with a single iteration fallback tracker explicitly initialized and typed to allow nulls (e.g., `let latest: number | null = -Infinity`), and handle extremum correctly.
