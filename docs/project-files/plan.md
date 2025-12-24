# Implementation Plan: Elite Local Directory UI

Progress: 0% 🟥

## 🟩 Confirmed Decisions
- [x] UI-First approach with mock data.
- [x] Separate route groups for Public/Owner/Admin.
- [x] Centralized mock data in `@/lib/mock-data.ts`.
- [x] Hybrid design: High-fidelity for Public, Clean for Dashboards.

## 🛠️ Phase 1: Foundation (Prompt 002)
- [ ] Create `@/lib/mock-data.ts` with comprehensive interfaces and data.
- [ ] Implement `(landing)/layout.tsx` with high-fidelity Navbar/Footer.
- [ ] Implement `dashboard/layout.tsx` with shadcn Sidebar.
- [ ] Implement `admin/layout.tsx` with admin-specific Navigation.

## 🎨 Phase 2: Public Experience (Prompt 003)
- [ ] Build `(landing)/page.tsx` (Homepage).
- [ ] Build `(landing)/categories/page.tsx` (Category List).
- [ ] Build `(landing)/categories/[slug]/page.tsx` (Category Listings).
- [ ] Build `(landing)/business/[id]/page.tsx` (Business Detail).

## ⚙️ Phase 3: Management Screens (Prompt 004)
- [ ] Build Owner Dashboard and Listing Forms.
- [ ] Build Admin Category Management and Approval Queue.
- [ ] Build Admin Audit Logs.

## 📁 File Changes
### Add
- `lib/mock-data.ts`
- `app/(landing)/categories/page.tsx`
- `app/(landing)/categories/[slug]/page.tsx`
- `app/(landing)/business/[id]/page.tsx`
- `app/admin/layout.tsx`
- `app/admin/page.tsx`
- `app/admin/categories/page.tsx`
- `app/admin/listings/page.tsx`

### Modify
- `app/(landing)/layout.tsx`
- `app/(landing)/page.tsx`
- `app/dashboard/layout.tsx`
- `app/dashboard/page.tsx`
