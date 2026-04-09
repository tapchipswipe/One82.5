## 2024-04-09 - Avoid slice and reduce loops for single passes
**Learning:** Performance-critical dataset iterations can suffer significant memory and CPU overhead when using standard Javascript patterns like \`.slice().reduce()\`, which allocate temporary arrays.
**Action:** Replace multi-pass operations with single-pass, boundary-checked \`for\` or \`for...of\` loops in performance-critical areas, particularly when dealing with large datasets arrays in React component rendering.
