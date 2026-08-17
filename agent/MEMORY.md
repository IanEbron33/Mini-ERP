# Project Memory & Session Status

## 1. Project Overview
* **Project Name:** Mini-ERP Web System (`mini-erp-app`)
* **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Auth, PostgreSQL DB & Row-Level Security), shadcn/ui primitives, Recharts, Lucide Icons, Sonner, jsPDF, html-to-image.
* **Workspace Location:** `c:\Users\ADMIN\Desktop\Folder1\mini-erp-app`

---

## 2. Design System Tokens (`agent/DESIGN.md`)
All UI components strictly adhere to the warm coffee/espresso color palette:
* **FOAM (`#fff7e8`)**: Main app background (`bg-[#fff7e8]`), search/date input backings, toggle containers.
* **CREMA (`#cfab71`)**: Golden accent highlights, active tags, secondary chart accents.
* **ROAST (`#7f5e35`)**: Subtitles, metadata, secondary text headers.
* **ESPRESSO (`#713105`)**: Primary CTA buttons, active navigation highlights, main chart bars/lines.
* **GROUNDS (`#4f351c`)**: Dark section headings, table headers.
* **NOIR (`#341100`)**: Page titles (*"Dashboard Overview"*), primary data values, main text.
* **Status Badges (Explicit HEX Tokens)**:
  * **Fulfilled / In Stock:** `bg-[#ebf5ed] text-[#15803d] border-[#c1e1c7]`
  * **Pending / Low Stock:** `bg-[#fdf0e6] text-[#713105] border-[#f1d0b5]`
  * **Cancelled / Out of Stock:** `bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]`

---

## 3. Typography & CSS Architecture
* **Font System**:
  * Body & UI: `Plus Jakarta Sans` (`--font-sans`).
  * Display & Brand Accents: `Playfair Display` (`--font-serif`).
* **PostCSS / Tailwind v4 Import Order ([app/globals.css](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/globals.css))**:
  * Google Fonts `@import url(...)` is positioned on Line 1 ahead of `@import "tailwindcss";` to satisfy CSS parsing specifications and avoid compiler errors.
* **Universal Number Input Reset**:
  * Default browser up/down stepper arrows (`::-webkit-outer-spin-button`, `::-webkit-inner-spin-button`, `-moz-appearance: textfield`) are suppressed globally in `app/globals.css`.

---

## 4. Currency System: Philippine Peso (`₱` / `PHP`)
* **Standard Currency Helper ([lib/currency.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/lib/currency.ts))**:
  * `formatPeso(amount)`: Formats numeric values to `₱X,XXX.XX`.
  * `formatPesoCompact(amount)`: Formats large values to `₱X.Xk` / `₱X.XM`.
  * `CURRENCY_SYMBOL = "₱"`.
* **Universal Application**: All dashboards, sales pricing tier cards, invoices, general ledgers, CSV report exports, product catalogs, and charts render exclusively in **Philippine Peso (`₱`)**.

---

## 5. Performance & Caching Engine: SWR In-Memory Cache ([lib/cache/swr-cache.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/lib/cache/swr-cache.ts))
* **Instant 0ms Page Navigation**: All tabs render cached views immediately with zero loading skeletons or spinners.
* **Silent Background Revalidation**: Fetches live updates from Supabase asynchronously without freezing the UI or shifting focus.
* **Targeted Mutation Invalidation (`invalidateCache`)**:
  * Order mutations (create, cancel, delete, status change) immediately purge and refresh `'admin_sales_data'`, `'admin_dashboard_metrics'`, `'admin_finance_ledger'`, and `'catalog_products'`.
  * Stock adjustments & restocks immediately purge and refresh `'catalog_products'`, `'admin_sales_data'`, `'admin_dashboard_metrics'`, and `'admin_finance_ledger'`.
* **Manual Refresh Bypass**: Each page's `[ Refresh ]` button forces a direct, synchronous database re-fetch on demand.

---

## 6. Authentication & Multi-Portal Architecture

### A. Authentication & Session Management
* **Staff Login (`/login`)** ([app/login/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/login/page.tsx)):
  * Staff email and password authentication backed by Supabase Auth (`signInAction`).
  * Features show/hide password toggle (`Eye`/`EyeOff` Lucide icons) and loading overlay backdrop.
* **Dynamic Password Reset Redirection ([app/actions/users.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/actions/users.ts))**:
  * `sendPasswordResetAction` dynamically extracts `x-forwarded-host` and `x-forwarded-proto` from `next/headers` to generate accurate production redirect URLs when deployed on Vercel or custom domains.
* **User Profile Card & Sign Out**: Active User Profile Card and Sign Out button in sidebar ([components/main-sidebar.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/main-sidebar.tsx)).
* **Next.js 16 Request Interceptor**: Edge request interceptor at [proxy.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/proxy.ts) handling session validation and role-based access control.

### B. Dedicated Route Namespaces
1. **Administrator Portal (`/admin/*`)**: System management, user administration, financial analytics, audit logs, unified inventory catalog, full order management.
2. **Sales Representative Portal (`/sales/*`)**: Sales performance, order creation, customer invoicing, read-only stock lookup.
3. **Inventory Manager Portal (`/inventory/*`)**: Real-time warehouse overview, low stock alerts, supplier replenishment dispatch, stock movement audit trail.

---

## 7. Key Features & Modules Completed

### 1. Dynamic Admin Dashboard & Analytics ([app/admin/dashboard/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/dashboard/page.tsx))
* **Live KPI Aggregations ([components/kpi-card.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/kpi-card.tsx))**:
  * Real-time Total Sales Revenue (`₱`), Catalog Products, Low-Stock Alerts, and Active Staff counts backed by `fetchDashboardMetricsAction` ([app/actions/dashboard.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/actions/dashboard.ts)).
  * SWR cached with instant 0ms mount.
* **Dynamic 6-Month Revenue Chart ([components/revenue-bar-chart.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/revenue-bar-chart.tsx))**:
  * Rolling 6-month monthly revenue & volume from actual `orders` with Bar / Area toggle.
  * Formatted Y-axis ticks (`₱0`, `₱550`, `₱1,100`, `₱1,650`, `₱2,200`) eliminating duplicate rounding labels.
* **Category Sales Distribution Donut ([components/category-pie-chart.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/category-pie-chart.tsx))**:
  * Calculates actual customer sales revenue per category with floating hover tooltips and centered total item count.
* **Recent Activity Feeds**:
  * Live Recent Orders feed with status badges and 1-click invoice modal preview.
  * Critical Low-Stock Alerts with direct navigation to Inventory.
  * Live date banner with manual data refresh button.

### 2. Dynamic Finance & Reports General Ledger Suite ([app/admin/finance/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/finance/page.tsx))
* **Unified Accounting Ledger Engine ([app/actions/finance.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/actions/finance.ts))**:
  * Inflows: Sales orders (`Income +`).
  * Outflows: Supplier inventory restocks (`Expense -`) computed via Wholesale Cost × Shift Quantity.
  * Line-by-line running ending balance calculation sorted chronologically.
* **Live Financial KPI Cards**:
  * **Gross Revenue (`₱`)**: Total sales inflow.
  * **Total Expenses (`₱`)**: Procurement inventory restock expenditures.
  * **Net Profit (`₱`)**: Net operating profit (`Gross Revenue - Total Expenses`).
  * **Estimated Tax Provision (`₱`)**: 15% net tax reserve.
* **Multi-Criteria Filter Suite**: Search keyword, Transaction Type (`All`, `Income`, `Expense`), and Category filters.
* **1-Click CSV Export Engine**: Generates clean, downloadable accounting spreadsheets (`Mini-ERP-General-Ledger-YYYY-MM-DD.csv`).

### 3. Sales & Orders Management Suite ([app/admin/sales/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/sales/page.tsx) & [app/sales/orders/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/sales/orders/page.tsx))
* **Dual Pricing Tiers (Retail & Wholesale)**: Side-by-side pricing tier cards with 1-click active tier selection and dynamic total calculation (`Quantity × Selected Tier Price` in `₱`).
* **Max Stock Limit Guard & Validation**: Real-time validation preventing orders exceeding warehouse stock with amber/red badge alerts.
* **Custom Shadcn Select Primitives ([components/ui/select.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/ui/select.tsx))**: Custom select dropdowns with React Portal rendering and smart auto-flipping.
* **Custom Delete Confirmation Dialog ([components/delete-confirm-modal.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/delete-confirm-modal.tsx))**: Reusable coffee-themed modal.
* **Automated Stock Deduction & Cancel Restocking**: Real-time stock decrement on order creation and automatic inventory restoration on cancellation.

### 4. Invoice Preview, Printing & 1-Click PDF Export ([components/invoice-modal.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/invoice-modal.tsx))
* **Live Product & SKU Data Binding**: Relational join (`*, order_items(*, products(*))`) binding exact product names, catalog SKUs, and unit prices (`₱`) to itemized invoice rows.
* **Dynamic "Issued By" Role Attribution**:
  * Admin Portal: Displays `Issued By: System Administrator` (`Administrator Portal`).
  * Sales Portal: Displays `Issued By: Sales Operations` (`Sales Representative`).
* **Direct 1-Click PDF Download (`html-to-image` + `jsPDF`)**: Client-side PDF generation that directly downloads `Invoice-ORD-XXXX.pdf` in `₱` without opening the print dialog.
* **Isolated 1-Page Portrait Printing**: `@media print` isolation hiding all background web app UI to generate a single clean sheet.

### 5. Inventory Management Suite

#### A. Stock Overview ([app/inventory/overview/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/overview/page.tsx))
* **Live Macro Warehouse KPIs**: Real-time Active SKUs, Total Units, Total Inventory Asset Valuation (`₱` wholesale basis), Items Requiring Restock, and Critical Out-of-Stock SKUs.
* **Live Critical Restock Priority Feed**: Real-time action feed highlighting products below reorder thresholds with an inline 1-click Restock Modal.
* **Category Stock & Valuation Breakdown Cards**: Category-by-category SKU counts, physical unit sums, and asset valuation in `₱`.
* **Category Distribution Donut Chart**: Visual representation of inventory asset proportion across categories.

#### B. Low Stock & Supplier Restock ([app/inventory/low-stock/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/low-stock/page.tsx))
* **Multi-Criteria Filter Suite**: Search input, custom coffee `<Select>` category dropdown, and Urgency buttons (`All Alerts`, `Out of Stock Only`, `Low Stock Only`).
* **Dynamic Restock Modal**:
  * Plain numeric text input (`inputMode="numeric"`) with zero stepper arrows and smooth backspacing/typing without sticky zero locks.
  * Quick preset quantity chips (`+10`, `+25`, `+50`, `+100`).
  * Live financial investment preview in Philippine Peso: $\text{Quantity} \times \text{Wholesale Cost} = \mathbf{₱X,XXX.XX}$.
  * Automated SWR cache invalidation synchronizing Overview, Catalog, Sales, and Finance.

#### C. Shared Product Catalog ([app/inventory/catalog/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/catalog/page.tsx))
* **Shared Directory**: Reused directly by Admin (`/admin/inventory`) and Inventory Manager (`/inventory/catalog`).
* **View Mode Switcher**: Toggle between Table View and Visual Card Grid View.
* **Interactive Image Upload**: Multi-format image dropzone (`.png`, `.jpg`, `.jpeg`, `.webp`) with Base64 preview and Supabase Storage bucket upload.
* **Cascading Delete with Service Role Client**: Safe deletion of dependent `stock_logs` and `order_items` records before deleting product rows.
* **Quick Stock Adjustment Modal**: Clean numeric input with add/deduct toggles and audit reference notes.

#### D. Stock Movement Audit Trail ([app/inventory/stock-logs/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/stock-logs/page.tsx))
* Operational audit trail displaying every stock deduction, order fulfillment, and supplier addition with timestamp, actor attribution, and balance after movement.

### 6. User Management & Administration ([app/admin/users/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/users/page.tsx))
* **Admin Staff Registration**: Admin-only staff creation via Supabase Service Role client (`registerEmployeeAction`).
* **Role & Account Management**: Edit staff role, activate/deactivate account, password reset links, and account deletion.
* **Multi-Criteria Filter Popover**: Role, Status, and Search filtering with active filter pills.

### 7. Global Feedback & UI Enhancements
* **Custom Coffee Select Primitives ([components/ui/select.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/ui/select.tsx))**: Reusable dropdown component replacing browser-native selects across all portals.
* **Sonner Toast System ([components/ui/sonner.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/ui/sonner.tsx))**: Real-time feedback across all actions.
* **Skeleton Loading States**: Shimmer loading rows eliminating visual flashes.
* **Strict Vector Icons**: Exclusively uses `lucide-react` vector icons (no emojis).

---

## 8. Strict User Preferences (`agent/SKILLS.md`)
1. **No Auto Build**: Do NOT run `npm run build` after every file change; run only when explicitly instructed.
2. **No Auto Dev Server**: Do NOT start `npm run dev` automatically; user runs it manually.
3. **No Auto Git Commits**: Do NOT perform git commit or push operations; user handles repository management.
4. **Do Not Auto-Update MEMORY.md**: Update only when explicitly requested by user.
5. **No Emoji Icons**: Strictly use Lucide or Shadcn vector icons.
6. **Design Alignment**: Always depend on `agent/DESIGN.md` for UI styling.
7. **Always Provide 3+ Options**: Provide 3 or more options when giving suggestions or recommendations.
8. **Read MEMORY.md**: Maintain contextual awareness once per session.
9. **Use Shadcn for UI Components**.
10. **Create Implementation Plan First**: Always create an implementation plan before adding or removing features.
