## 2026-10-30T09:27:02Z
You are the Sub-agent UI/UX for Member 2: Product module.

Working Directory: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ui_ux_designer_1
Original Request: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\teamwork\ORIGINAL_REQUEST.md
Project Document: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\PROJECT.md
Project Guidelines: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\AGENTS.md
Skill Reference: C:\AI_Agent_VideCoding\SE1909_G5_SDN302_FinalProject\SE1909_G5_SDN302_FinalProject\.agents\skills\product-management\SKILL.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Mission:
Create the minimalist, clean UI/UX specification document for Gate 1 (Product Management - Admin CRUD & Public Catalog) and Gate 2/3 (Search, Filter, Sort).
1. Read ORIGINAL_REQUEST.md, PROJECT.md, and frontend styles in `shop-project/frontend/src/index.css`.
2. Design the wireframes and UX specifications for:
   - Admin Products Management (`/admin/products`):
     - Table columns (Image thumbnail, Product Name & SKU/Brand, Category, Price & Original Price, Stock count, Active toggle switch/button, Actions: Edit, Delete).
     - CRUD Modal (Add/Edit Product): Inputs for Name, Category, Price, Original Price, Stock, Brand, Description, Image URL(s), Active status. Form validation, submit & cancel buttons using `.btn-primary` and `.btn-secondary`, modal styles (`.modal-backdrop`, `.modal-card`).
     - Delete confirmation dialog.
   - Public Products Catalog (`/products`):
     - Product Card: Image, Category badge, Title, Discount tag if originalPrice > price, formatted Price in VND/USD, Stock badge (In stock / Out of stock).
     - Search & Filter layout placeholders (for Gate 2 & 3).
     - Empty state design when no products exist.
3. Write the complete specification to `ui_ux_specs.md` in your working directory.
4. Deliver `handoff.md` and transition to Idle state.
