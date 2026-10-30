# UI/UX Specifications: Product Search & Empty State (Part 5 - Gate 2)
**Project**: Shop Quần Áo - Fashion E-Commerce System (SE1909 G5 SDN302)  
**Author**: Sub-agent UI/UX Designer  
**Scope**: Gate 2 (Part 5: Product Search)  
**Status**: APPROVED SPECIFICATION  

---

## 1. Executive Summary & Design Principles

Part 5 (Gate 2) focuses on creating a seamless, lightning-fast product search experience across both the **Public Customer Catalog** (`ProductsPage.jsx`) and the **Admin Product Management** (`AdminProductsPage.jsx`).

### 1.1 Minimal Code Principle (`AGENTS.md`)
In strict adherence to the project guidelines:
1. **Zero New External Packages**: Do not add Lodash, React-Debounce, or external UI component libraries. Use native React hooks (`useState`, `useEffect`, `useCallback`, `useRef`) and existing `lucide-react` icons.
2. **Reusing Existing Styles & Tokens**: Leverage existing design tokens and utility classes in `shop-project/frontend/src/index.css`:
   - Design tokens: `--primary: #0f172a`, `--border-light: #e2e8f0`, `--text-muted: #64748b`, `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`.
   - Button styles: `.btn-primary`, `.btn-secondary`.
   - Empty state structure: `.empty-state-box`, `.empty-icon`.
   - Spinner animation: `.admin-users-spin` (defined as keyframe rotation in `index.css`).
3. **No Redundant Abstraction Layers**: No unnecessary wrapper components or Higher-Order Components (HOCs). Code is kept lean, clear, and embedded directly in each page component.

---

## 2. Search Bar Specifications

### 2.1 Visual Anatomy & Component Breakdown

```text
+----------------------------------------------------------------------------------------+
|  [Icon: Search / Spinner]  | Input: "Tìm kiếm theo tên sản phẩm..." | [Button: (X) Clear]  |
+----------------------------------------------------------------------------------------+
  ^                                                                     ^
  |                                                                     |
  Left Icon:                                                            Right Icon:
  - Idle: Lucide `Search` (16-18px, #94a3b8)                           - Visible ONLY when input has text
  - Searching/Debouncing: Lucide `RefreshCw` or `Loader2`               - Lucide `X` (14-16px, #94a3b8 -> #0f172a)
    with `.admin-users-spin` for instant feedback                      - Instant clear on 1 click
```

### 2.2 Detailed Element Specifications

| Element | Specification | Visual / Styling Details |
|---|---|---|
| **Container** | Relative positioning container | `position: 'relative'`, flexible width (`flex: '1 1 300px'`, `maxWidth: '480px'`) |
| **Leading Icon (Left)** | Search Icon or Loading Spinner | Absolute positioned: `left: '12px'`, `top: '50%'`, `transform: 'translateY(-50%)'`. <br>• Default: `<Search size={18} color="#94a3b8" />`<br>• While debouncing/loading: `<RefreshCw size={17} className="admin-users-spin" color="#64748b" />` |
| **Input Element** | Native `<input type="text" />` | • Background: `#ffffff`<br>• Border: `1px solid #cbd5e1`<br>• Radius: `10px` (Client) / `8px` (Admin)<br>• Padding: `9px 36px 9px 38px`<br>• Font: `13px`, text color `#0f172a`<br>• Focus ring: `outline: none`, `borderColor: #0f172a`, `boxShadow: 0 0 0 3px rgba(15, 23, 42, 0.08)`<br>• Accessibility: `aria-label="Tìm kiếm sản phẩm"` |
| **Trailing Clear Button (Right)** | Quick clear "X" button | • Rendered conditionally: `{searchInput.length > 0 && (...)}`<br>• Icon: `<X size={16} />`<br>• Absolute positioned: `right: '10px'`, `top: '50%'`, `transform: 'translateY(-50%)'`<br>• Padding: `4px`, `borderRadius: '50%'`, `cursor: 'pointer'`<br>• Hover: `color: '#0f172a'`, `background: '#f1f5f9'`<br>• Accessibility: `aria-label="Xóa từ khóa tìm kiếm"`, `title="Xóa từ khóa"` |

---

## 3. 300ms Debounce UX Behavior Specification

### 3.1 Interaction Flow & Timing Diagram

```text
User Keystroke       Keystrokes within 300ms         User stops typing
   [ "a" ]   --->       [ "áo" ]   --->   [ "áo k" ]   --- (300ms idle) --->  Trigger Query
      |                    |                 |                                      |
  Tier 1 State         Tier 1 State      Tier 1 State                           Tier 2 State
(Immediate: 60fps)   (Immediate: 60fps)(Immediate: 60fps)                   (API Fetch/URL Sync)
      |                    |                 |                                      |
  Timer: #1            Reset #1          Reset #2                               Timer #3
(Cleared by "áo")    (Cleared by "áo k") (Runs for 300ms)                    (Executes callback)
```

### 3.2 Debounce Logic Architecture

1. **Two-Tier State Separation**:
   - **Tier 1 (Immediate Local State)**: `searchInput` (Client) or `searchQuery` (Admin).
     - Controlled directly by `onChange={(e) => setSearchInput(e.target.value)}`.
     - Zero lag or input lock; typing remains smooth and responsive at 60fps.
   - **Tier 2 (Debounced Trigger State)**: Propagates to URL search params in `ProductsPage.jsx` or triggers `fetchProducts` in `AdminProductsPage.jsx`.
     - Executes exactly **300ms** after the last keystroke.

2. **Debounce Timer Mechanism**:
   ```javascript
   useEffect(() => {
     // If input is currently different from applied search
     if (searchInput.trim() === activeSearch) return;

     setIsDebouncing(true);
     const timer = setTimeout(() => {
       setIsDebouncing(false);
       onSearchCommit(searchInput.trim());
     }, 300);

     return () => {
       clearTimeout(timer);
       setIsDebouncing(false);
     };
   }, [searchInput, activeSearch]);
   ```

3. **Immediate Bypass Triggers**:
   - **Clicking Clear "X"**:
     - Bypasses the 300ms delay completely.
     - Immediately clears local state (`setSearchInput('')`).
     - Immediately commits empty search query (`updateParams({ search: undefined, page: 1 })`).
     - Immediately resets pagination to page 1.
   - **Pressing `Enter`**:
     - If user presses `Enter` in the input field, the debounce timer is immediately flushed and search is executed without waiting for the remainder of the 300ms.
   - **Pressing `Escape`**:
     - Clears the search text immediately and restores the full catalog.

4. **Trimming & Edge Case Handling**:
   - Whitespace only (e.g., `"   "`): Treated as empty string; does not initiate an API call if current search is already empty.
   - Special characters (e.g. `[`, `*`, `+`, `?`): Passed safely in the URL query string; Backend Escaping sanitizes these safely.

---

## 4. Empty State Specifications

### 4.1 Comparison: No Items in Shop vs. Search Yields No Results

| Criteria | Generic Empty Shop | Search Yields No Results (Part 5 Focus) |
|---|---|---|
| **Trigger** | Database collection is empty (`products.length === 0` and `search` is empty) | User searched for keyword that has no matches (`products.length === 0` and `Boolean(search)`) |
| **Headline** | "Cửa hàng chưa có sản phẩm" | "Không Tìm Thấy Sản Phẩm Phù Hợp" |
| **Subtext** | "Hiện tại chưa có sản phẩm nào trong danh mục này. Vui lòng quay lại sau." | "Không tìm thấy sản phẩm nào khớp với từ khóa **\"{keyword}\"**. Vui lòng thử từ khóa khác hoặc xóa bộ lọc." |
| **Primary Action** | Quay lại Trang chủ / Xem tất cả | **"Xóa Từ Khóa Tìm Kiếm"** (clears search query and restores catalog) |

### 4.2 Visual Layout & ASCII Wireframe: Search Empty State

```text
+----------------------------------------------------------------------------------------+
|                                                                                        |
|                                    [ (Search Icon) ]                                   |
|                                                                                        |
|                            Không Tìm Thấy Sản Phẩm Phù Hợp                             |
|                                                                                        |
|             Không có sản phẩm nào khớp với từ khóa "áo khoác da lộn".                  |
|             Vui lòng thử lại với từ khóa khác hoặc xóa bộ lọc tìm kiếm.                |
|                                                                                        |
|                          [ (X) Xóa Từ Khóa Tìm Kiếm ]                                  |
|                                                                                        |
+----------------------------------------------------------------------------------------+
```

### 4.3 Component Styling & Classes
- **Box Container**: `.empty-state-box`
  ```css
  /* Existing in index.css */
  .empty-state-box {
    text-align: center;
    padding: 50px 20px;
    border: 2px dashed #cbd5e1;
    border-radius: var(--radius-lg);
    color: var(--text-muted);
    background: #ffffff;
  }
  ```
- **Icon**: Lucide `<Search size={44} className="empty-icon" />` with subtle muted color `#94a3b8`.
- **Keyword Highlight**: Bold text with primary color:
  `<strong style={{ color: '#0f172a' }}>"{searchKeyword}"</strong>`
- **Action Button**: Reuses `.btn-primary` or `.btn-secondary`:
  - Client catalog: `<button className="btn-primary" onClick={handleClearSearch}><X size={15} /> Xóa tìm kiếm</button>`
  - Admin management: `<button className="btn-secondary" onClick={handleClearSearch}><RotateCcw size={14} /> Xóa tìm kiếm</button>`

---

## 5. Screen-Specific Placement & Implementation Guidelines

### 5.1 Public Client Catalog (`shop-project/frontend/src/pages/ProductsPage.jsx`)

#### Placement:
Inside the **Top Search & Sort Bar** directly above the product catalog grid:
- Left: 300ms Debounced Search Bar with dynamic search/spinner icon and instant clear "X".
- Right: Sort By dropdown (`Mới nhất`, `Giá thấp -> cao`, etc.).

#### Active Search Query Indicator:
Directly beneath the search bar, when a search is active:
```jsx
{urlSearch && (
  <div style={{ marginBottom: '16px', fontSize: '14px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <span>Kết quả tìm kiếm cho: <strong style={{ color: '#0f172a' }}>&ldquo;{urlSearch}&rdquo;</strong> ({total} sản phẩm)</span>
    <button
      type="button"
      onClick={handleClearSearch}
      style={{ fontSize: '12px', color: '#dc2626', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
    >
      Xóa lọc
    </button>
  </div>
)}
```

#### Minimal JSX Template for `ProductsPage.jsx`:
```jsx
{/* Search Input Container */}
<div style={{ position: 'relative', flex: '1 1 300px', maxWidth: '480px' }}>
  {/* Leading Icon: Toggle Search or Spinner */}
  {isSearching ? (
    <RefreshCw
      size={18}
      className="admin-users-spin"
      style={{ position: 'absolute', top: '11px', left: '12px', color: '#64748b' }}
    />
  ) : (
    <Search
      size={18}
      style={{ position: 'absolute', top: '11px', left: '12px', color: '#94a3b8' }}
    />
  )}

  <input
    type="text"
    placeholder="Tìm kiếm theo tên sản phẩm, thương hiệu..."
    value={searchInput}
    onChange={(e) => setSearchInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Escape') handleClearSearch();
    }}
    aria-label="Tìm kiếm sản phẩm"
    style={{
      width: '100%',
      padding: '9px 36px 9px 38px',
      borderRadius: '10px',
      border: '1px solid #cbd5e1',
      fontSize: '13px',
      outline: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
  />

  {/* Quick Clear Button */}
  {searchInput && (
    <button
      type="button"
      onClick={handleClearSearch}
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="Xóa từ khóa tìm kiếm"
      aria-label="Xóa từ khóa tìm kiếm"
    >
      <X size={16} />
    </button>
  )}
</div>
```

---

### 5.2 Admin Product Management (`shop-project/frontend/src/pages/admin/AdminProductsPage.jsx`)

#### Current Issue in Part 4 Codebase:
In `AdminProductsPage.jsx`:
- Line 265: `query` triggers `fetchProducts` immediately on every keystroke (`onChange={(e) => { setQuery(e.target.value); setPage(1); }}`).
- No debounce exists.
- No quick clear "X" button exists.
- No search loading indicator exists.
- Empty state displays generic "Thêm sản phẩm đầu tiên" even when user is filtering/searching.

#### Specification for Admin Refactor:
1. **Debounce 300ms in Admin**:
   - Introduce `localQuery` for immediate input typing.
   - Use `debouncedQuery` (or timer) to trigger `fetchProducts` after 300ms idle.
2. **Instant Clear "X"**:
   - Add `<X size={15} />` button inside input right side.
   - On click: `setLocalQuery('')`, `setDebouncedQuery('')`, reset `page` to 1.
3. **Search Loading Indicator**:
   - When searching/fetching, show spinning `<RefreshCw size={15} className="admin-users-spin" />` in place of `<Search />`.
4. **Contextual Admin Empty State**:
   - If `query` is non-empty, render:
     - Heading: "Không tìm thấy sản phẩm"
     - Subtext: "Không có sản phẩm nào khớp với từ khóa \"{query}\"."
     - Button: `<button className="btn-secondary" onClick={handleClearSearch}>Xóa bộ lọc tìm kiếm</button>`

#### Minimal JSX Template for `AdminProductsPage.jsx`:
```jsx
{/* Admin Search Bar */}
<div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '380px' }}>
  {loading && query ? (
    <RefreshCw
      size={16}
      className="admin-users-spin"
      style={{ position: 'absolute', top: '11px', left: '12px', color: '#64748b' }}
    />
  ) : (
    <Search
      size={16}
      style={{ position: 'absolute', top: '11px', left: '12px', color: '#94a3b8' }}
    />
  )}

  <input
    type="text"
    placeholder="Tìm theo tên, thương hiệu, danh mục..."
    value={localQuery}
    onChange={(e) => setLocalQuery(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === 'Escape') handleClearQuery();
    }}
    aria-label="Tìm kiếm sản phẩm trong quản trị"
    style={{
      width: '100%',
      padding: '8px 32px 8px 36px',
      borderRadius: '8px',
      border: '1px solid #cbd5e1',
      fontSize: '13px',
      background: '#ffffff',
      outline: 'none',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    }}
  />

  {localQuery && (
    <button
      type="button"
      onClick={handleClearQuery}
      style={{
        position: 'absolute',
        top: '9px',
        right: '10px',
        background: 'none',
        border: 'none',
        color: '#94a3b8',
        cursor: 'pointer',
        padding: '2px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      title="Xóa tìm kiếm"
      aria-label="Xóa từ khóa tìm kiếm"
    >
      <X size={15} />
    </button>
  )}
</div>
```

---

## 6. Accessibility & Micro-Interactions

1. **Keyboard Accessibility**:
   - Users can press `Escape` inside the search bar to clear search input immediately.
   - Users can press `Enter` to submit immediately (flushing debounce).
   - Clear button is focusable via keyboard (`Tab`), with accessible `aria-label="Xóa từ khóa tìm kiếm"`.
2. **Focus State**:
   - `input:focus`: `border-color: #0f172a`, `box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08)`.
3. **Touch Targets**:
   - Clear "X" button has an effective hit area of at least `28x28px` to ensure comfortable interaction on mobile and tablet devices.
4. **Preventing Cumulative Layout Shift (CLS)**:
   - Search bar height and padding remain identical whether loading spinner is active or idle.
   - Icon swap between `Search` and `RefreshCw` uses fixed dimensions (`16px` / `18px`) to prevent any jitter.

---

## 7. Guidelines for Downstream Sub-Agents

### 7.1 For Backend Sub-Agent (`backend_part5`):
- Endpoint: `GET /api/products?search=...`
- Regex Escaping: Escape all special characters `[`, `]`, `(`, `)`, `{`, `}`, `*`, `+`, `?`, `.`, `\`, `^`, `$`, `|` before building Mongo query.
- Case-insensitivity: `$regex: escapedKeyword, $options: 'i'` across `name` and `description`.
- Return format: `{ success: true, count, total, totalPages, currentPage, products: [...] }`.

### 7.2 For Frontend Sub-Agent (`frontend_part5`):
- Implement the 300ms debounce and instant "X" button in both `ProductsPage.jsx` and `AdminProductsPage.jsx`.
- Implement the search loading spinner indicator.
- Refactor the empty state in both pages to dynamically display the friendly message:
  `"Không tìm thấy sản phẩm phù hợp với từ khóa \"{keyword}\""` and the Clear Search button.
- Follow Minimal Code Principle: Do not import any new packages.

### 7.3 For Tester Sub-Agent (`tester_part5`):
- Test cases for search input debounce:
  - Rapid keystrokes trigger only 1 API call after 300ms.
  - Clicking "X" button immediately clears text and triggers reset to page 1.
  - Rendering empty state with keyword when API returns 0 items.
  - Test searching with special characters (`[`, `*`, `+`, `?`, etc.) does not cause errors or crash UI.
