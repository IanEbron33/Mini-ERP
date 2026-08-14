# Project Memory & Session Status

## 1. Project Overview
* **Project Name:** Mini-ERP Web System (`mini-erp-app`)
* **Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Supabase (Auth, PostgreSQL DB & Row-Level Security), shadcn/ui primitives, Recharts, Lucide Icons, Sonner.
* **Workspace Location:** `c:\Users\ADMIN\Desktop\Folder1\mini-erp-app`

---

## 2. Design System Tokens (`agent/DESIGN.md`)
All UI components strictly adhere to the warm coffee/espresso color palette:
* **FOAM (`#fff7e8`)**: Main app background (`bg-[#fff7e8]`), search/date input backings, toggle containers.
* **CREMA (`#cfab71`)**: Golden accent highlights, active tags, secondary chart accents.
* **ROAST (`#7f5e35`)**: Subtitles, metadata, secondary text headers.
* **ESPRESSO (`#713105`)**: Primary CTA buttons, active navigation highlights, main chart bars/lines.
* **GROUNDS (`#4f351c`)**: Dark section headings, table headers.
* **NOIR (`#341100`)**: Page titles (*"Dashboard Overview"*), primary data values (`$124,592.00`), main text.

---

## 3. Authentication & Multi-Portal Architecture

### A. Authentication & Session Management
* **Staff Login (`/login`)** ([app/login/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/login/page.tsx)):
  * Staff email and password authentication backed by Supabase Auth (`signInAction`).
  * Features show/hide password toggle (`Eye`/`EyeOff` Lucide icons) and a centered circular loading overlay backdrop during authentication.
* **User Profile Card & Sign Out**: Replaced manual role switcher with active User Profile Card and Sign Out button ([components/main-sidebar.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/main-sidebar.tsx)).
* **Next.js 16 Request Interceptor**: Edge request interceptor at [proxy.ts](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/proxy.ts) handling session validation and role-based access control.

### B. Dedicated Route Namespaces
1. **Administrator Portal (`/admin/*`)**: Full system management, user administration, financial ledgers, system audit logs, unified inventory management.
2. **Sales Representative Portal (`/sales/*`)**: Order creation, invoicing, read-only stock lookup.
3. **Inventory Manager Portal (`/inventory/*`)**: SKU catalog management, stock movement logs, low-stock reorder triggers.

---

## 4. Key Features & Administrative Capabilities Completed

1. **User Management & 4-Action Dropdown Menu** ([app/admin/users/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/admin/users/page.tsx)):
   * **Admin Employee Registration**: Admin-only staff creation via Supabase Service Role client (`registerEmployeeAction`).
   * **✏️ Edit Staff Role**: Opens modal to re-assign portal access (`Admin`, `Sales`, `Inventory`) and updates Supabase `profiles` & `auth.users`.
   * **🔄 Activate / Deactivate Account**: Toggles staff account status between `Active` and `Inactive`.
   * **🔑 Send Password Reset**: Dispatches password recovery link to work email (`sendPasswordResetAction`).
   * **🗑️ Delete Account**: Prompts confirmation modal before deleting user via `deleteEmployeeAction`.
   * **Intelligent Popover Direction & Bottom Padding**: Popover opens upwards (`bottom-10`) on lower rows with container `pb-28`, eliminating layout and sidebar height jumps.
   * **Multi-Criteria Directory Filter**: Interactive Filter button with popover for Role, Status, and Search filtering with active filter pills.

2. **Option 4 All-In-One Inventory & Product Suite** ([app/inventory/catalog/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/catalog/page.tsx)):
   * **Shared Product Directory**: Reused directly by Admin (`/admin/inventory`) and Inventory Manager (`/inventory/catalog`) to prevent code redundancy.
   * **View Mode Switcher**: Toggle between **Table View** 📊 and **Visual Card Grid View** 🖼️ with full product card previews and action footers.
   * **Smooth Manual Numeric Input**: Hides browser arrow steppers (`[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none`) across Initial Stock, Reorder Level, Retail Price, Wholesale Price, and Quick Stock Adjustment fields.
   * **Interactive Image Upload**: Multi-format image dropzone (`.png`, `.jpg`, `.jpeg`, `.webp`) with instant FileReader Base64 thumbnail preview and circular spinning loader state.
   * **Supabase Bucket Upload & Base64 Fallback**: `uploadProductImageAction` uploads image files to Supabase Storage bucket (`product-images`) with automatic Base64 fallback if bucket is missing.
   * **Cascading Delete with Admin Service Role Client**: `deleteProductAction` uses `createAdminClient()` (`SUPABASE_SERVICE_ROLE_KEY`) to safely remove dependent `stock_logs` and `order_items` records before deleting product rows, bypassing RLS constraints.
   * **Low Stock & Restock Action** ([app/inventory/low-stock/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/low-stock/page.tsx)): Filtered real-time low-stock directory with 1-click supplier restock shipment modal.
   * **Stock Movement Audit Trail** ([app/inventory/stock-logs/page.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/app/inventory/stock-logs/page.tsx)): Live audit log tracking stock additions and deductions with net shift KPI cards.

3. **Global Toast Notification System** ([components/ui/sonner.tsx](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/components/ui/sonner.tsx)):
   * Integrated `sonner` shadcn toast notification system (`components/ui/sonner.tsx` & `app/layout.tsx`) firing real-time toasts for product creation, SKU edits, image uploads, stock shifts, and deletions.

4. **Option 1 Skeleton Loading States**:
   * Implemented skeleton shimmer loading rows (`animate-pulse`) across **User Management**, **Product Catalog**, **Stock Movement Logs**, and **Sales Orders** pages to eliminate visual flashes of fallback mock data.

5. **Database Schema & RLS Policies** ([supabase/schema.sql](file:///c:/Users/ADMIN/Desktop/Folder1/mini-erp-app/supabase/schema.sql)):
   * DDL for 6 tables (`profiles`, `products`, `orders`, `order_items`, `stock_logs`, `audit_logs`), RLS policies (including `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies for `products`, `stock_logs`, and `order_items`), and `handle_new_user()` trigger.

---

## 5. Strict User Preferences (`agent/SKILLS.md` & `agent/AGENTS.md`)
1. **No Auto Build**: Do NOT run `npm run build` after every file change; run only when explicitly requested by the user.
2. **No Auto Dev Server**: Do NOT start `npm run dev` automatically; user handles local dev server.
3. **No Auto Git Commits**: Do NOT perform git commit or push operations; user handles repository management.
4. **Design Alignment**: Always reference `agent/DESIGN.md` for any UI implementations or styling changes.
5. **Always Provide 3+ Options**: Provide 3 or more options whenever making suggestions or recommendations.
6. **Use shadcn for UI components**.
