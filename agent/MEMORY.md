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

## 3. Authentication & Multi-Portal Architecture

### A. Authentication & Session Management
* **Staff Login (`/login`)** ([app/login/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/login/page.tsx)):
  * Staff email and password authentication backed by Supabase Auth (`signInAction`).
  * Features show/hide password toggle (`Eye`/`EyeOff` Lucide icons) and loading overlay backdrop.
* **User Profile Card & Sign Out**: Active User Profile Card and Sign Out button in sidebar ([components/main-sidebar.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/main-sidebar.tsx)).
* **Next.js 16 Request Interceptor**: Edge request interceptor at [proxy.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/proxy.ts) handling session validation and role-based access control.

### B. Dedicated Route Namespaces
1. **Administrator Portal (`/admin/*`)**: System management, user administration, financial analytics, audit logs, unified inventory catalog, full order management.
2. **Sales Representative Portal (`/sales/*`)**: Sales performance, order creation, customer invoicing, read-only stock lookup.
3. **Inventory Manager Portal (`/inventory/*`)**: SKU catalog management, stock movement logs, low-stock restock shipments.

---

## 4. Key Features & Capabilities Completed

### 1. Dynamic Admin Dashboard & Real-Time Analytics ([app/admin/dashboard/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/dashboard/page.tsx))
* **Live KPI Aggregations ([components/kpi-card.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/kpi-card.tsx))**:
  * Real-time Total Sales Revenue, Active Catalog Products, Low-Stock Alerts, and Active Staff counts backed by `fetchDashboardMetricsAction` ([app/actions/dashboard.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/actions/dashboard.ts)).
  * Dynamic month-over-month growth calculations and animated shimmer skeleton loaders.
* **Dynamic 6-Month Revenue Chart ([components/revenue-bar-chart.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/revenue-bar-chart.tsx))**:
  * Rolling 6-month monthly revenue & volume distribution from actual Supabase `orders` with Bar / Area chart switching.
* **Category Sales Distribution Donut ([components/category-pie-chart.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/category-pie-chart.tsx))**:
  * Calculates actual customer sales revenue generated per category with floating hover tooltips and non-colliding center total count.
* **Recent Activity Feeds**:
  * Live Recent Orders feed with status badges and 1-click invoice modal preview.
  * Critical Low-Stock Alerts with direct navigation to Inventory.
  * Live date banner with manual data refresh button.

### 2. Sales & Orders Management Suite ([app/admin/sales/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/sales/page.tsx) & [app/sales/orders/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/sales/orders/page.tsx))
* **Dual Pricing Tiers (Retail & Wholesale)**: Side-by-side pricing tier cards with 1-click active tier selection and dynamic total calculation (`Quantity × Selected Tier Price`).
* **Max Stock Limit Guard & Validation**: Real-time validation preventing orders exceeding warehouse stock with amber/red badge alerts.
* **Custom Shadcn Select Primitives ([components/ui/select.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/ui/select.tsx))**: Custom select dropdowns with React Portal rendering and smart auto-flipping.
* **Custom Delete Confirmation Dialog ([components/delete-confirm-modal.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/delete-confirm-modal.tsx))**: Reusable coffee-themed modal.
* **Automated Stock Deduction & Cancel Restocking**: Real-time stock decrement on order creation and automatic inventory restoration on cancellation.

### 3. Invoice Preview, Printing & 1-Click PDF Export ([components/invoice-modal.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/invoice-modal.tsx))
* **Live Product & SKU Data Binding**: Relational join (`*, order_items(*, products(*))`) binding exact product names and catalog SKUs to itemized invoice rows.
* **Dynamic "Issued By" Role Attribution**:
  * Admin Portal: Displays `Issued By: System Administrator` (`Administrator Portal`).
  * Sales Portal: Displays `Issued By: Sales Operations` (`Sales Representative`).
* **Direct 1-Click PDF Download (`html-to-image` + `jsPDF`)**: Client-side PDF generation that directly downloads `Invoice-ORD-XXXX.pdf` without opening the print dialog, immune to CSS color parser issues.
* **Isolated 1-Page Portrait Printing**: `@media print` isolation hiding all background web app UI (sidebar, header, tables) to generate a single clean sheet.

### 4. Inventory & Product Suite ([app/inventory/catalog/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/catalog/page.tsx))
* **Shared Product Directory**: Reused directly by Admin (`/admin/inventory`) and Inventory Manager (`/inventory/catalog`).
* **View Mode Switcher**: Toggle between Table View and Visual Card Grid View.
* **Interactive Image Upload**: Multi-format image dropzone (`.png`, `.jpg`, `.jpeg`, `.webp`) with Base64 preview and Supabase Storage bucket upload.
* **Cascading Delete with Service Role Client**: Safe deletion of dependent `stock_logs` and `order_items` records before deleting product rows.
* **Low Stock & Restock Workflow** ([app/inventory/low-stock/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/low-stock/page.tsx)): Filtered low-stock directory with 1-click supplier restock modal.
* **Stock Movement Audit Trail** ([app/inventory/stock-logs/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/stock-logs/page.tsx)): Audit log tracking all stock additions and deductions.

### 5. User Management & Administration ([app/admin/users/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/users/page.tsx))
* **Admin Staff Registration**: Admin-only staff creation via Supabase Service Role client (`registerEmployeeAction`).
* **Role & Account Management**: Edit staff role, activate/deactivate account, password reset links, and account deletion.
* **Multi-Criteria Filter Popover**: Role, Status, and Search filtering with active filter pills.

### 6. Global Feedback & UI Enhancements
* **Sonner Toast System ([components/ui/sonner.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/ui/sonner.tsx))**: Real-time feedback across all actions.
* **Skeleton Loading States**: Shimmer loading rows eliminating visual flashes.
* **Strict Vector Icons**: Exclusively uses `lucide-react` vector icons (no emojis).

---

## 5. Strict User Preferences (`agent/SKILLS.md`)
1. **No Auto Build**: Do NOT run `npm run build` after every file change; run only when explicitly instructed.
2. **No Auto Dev Server**: Do NOT start `npm run dev` automatically; user runs it manually.
3. **No Auto Git Commits**: Do NOT perform git commit or push operations; user handles repository management.
4. **Do Not Auto-Update MEMORY.md**: Update only when explicitly requested by user.
5. **No Emoji Icons**: Strictly use Lucide or Shadcn vector icons.
6. **Design Alignment**: Always depend on `agent/DESIGN.md` for UI styling.
7. **Always Provide 3+ Options**: Provide 3 or more options when giving suggestions or recommendations.
8. **Read MEMORY.md**: Maintain contextual awareness.
9. **Use Shadcn for UI Components**.
10. **Create Implementation Plan First**: Always create an implementation plan before adding or removing features.
