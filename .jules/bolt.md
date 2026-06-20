## 2026-06-20 - Array map/filter/sort chain replacement
**Learning:** Chained array methods (like `.map().filter().sort()[0]`) to find extreme values scale poorly (O(N log N) time, multiple O(N) memory allocations). Using `.sort()[0] || null` specifically forces unnecessary sorts to find a single max/min item.
**Action:** Always replace `.sort()[0]` (or extremum chains) with a single pass O(N) loop tracking the extremum variable iteratively. Ensure variable defaults account for potential zeros (e.g. `let latest = -Infinity; if (latest === -Infinity) latest = null;`).
