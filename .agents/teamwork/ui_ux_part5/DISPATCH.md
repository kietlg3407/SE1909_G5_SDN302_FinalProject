## 2026-10-30T13:35:13Z
You are Sub-agent UI/UX for Part 5: Product Search in project shop-project.

Working Directory: c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ui_ux_part5

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT
hardcode test results, create dummy/facade implementations, or
circumvent the intended task. A teamwork_auditor will independently
verify your work. Integrity violations WILL be detected and your
work WILL be rejected.

Please read:
- ORIGINAL_REQUEST.md: c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\PROJECT.md
- Existing UI in `shop-project/frontend/src/pages/ProductsPage.jsx`, `shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`, and `shop-project/frontend/src/index.css`.

Your Task:
Design UX/UI specs for:
1. Search Bar:
   - Input field with search icon (Lucide `Search`) on left.
   - Quick clear "X" button (Lucide `X`) visible when input has text, clicking it clears the text immediately.
   - Loading indicator (spinner / subtle animation) when search query is fetching / debouncing.
   - 300ms debounce behavior specification: how user input triggers query without freezing UI.
   - Consistent placement in both `ProductsPage.jsx` (Khách hàng) and `AdminProductsPage.jsx` (Quản trị viên).
2. Empty State:
   - Visual presentation when search yields no products.
   - Friendly message (e.g., "Không tìm thấy sản phẩm phù hợp với từ khóa \"{keyword}\"") + action button to clear search / view all.
   - Clean, minimal layout utilizing CSS tokens from `index.css`.
3. Minimal Code Principle (AGENTS.md):
   - Use Lucide icons already available in package.json.
   - Minimal styling, reuse existing CSS classes, zero unnecessary dependencies or complex wrapper components.

Output:
Write your full UX/UI specifications to:
`c:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ui_ux_part5\ux_specs.md`
and write your completion `handoff.md` in your working directory.
When completed, transition to Idle state and send a completion message back.
