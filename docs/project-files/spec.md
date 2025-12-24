# Specification: Elite Local Directory (UI-First MVP)

## 🎯 Goal
Build a high-fidelity UI for a local business directory using Next.js 16 and Tailwind v4. The implementation will be "UI-first," meaning all screens will be fully functional using a centralized mock data library, with no live database (Convex) or auth (Clerk) logic required in the initial phase.

## 🏗️ Architecture & Routing
- **Routing Strategy**: Separate route groups for different user roles.
  - `(landing)/*`: Public user screens.
  - `dashboard/*`: Business owner management.
  - `admin/*`: Platform administration.
- **Mock Data**: Centralized in `@/lib/mock-data.ts` to ensure consistency across screens.
- **Design System**: 
  - **Public**: High-motion, bespoke UI using MagicUI, KokonutUI, and Framer Motion.
  - **Dashboard/Admin**: Clean, utility-first shadcn/ui for efficiency and clarity.

## 📄 Screen Requirements

### 1. Public Journey (`(landing)`)
- **Main Homepage**: Featured listings carousel + Category grid.
- **Category List**: Grid of all available business categories.
- **Category Listing**: List of businesses filtered by a specific category.
- **Business Detail**: Template-driven page showing dynamic sections (Hero, Info, Menu, Gallery).

### 2. Business Owner (`dashboard`)
- **Dashboard**: Table of owned businesses with status badges.
- **Create/Edit Listing**: Multi-section form driven by category templates with mock file upload states.

### 3. Admin (`admin`)
- **Admin Dashboard**: Overview cards and quick links.
- **Category Management**: Table and form to define template sections for each category.
- **Pending Listings**: Approval queue for submitted businesses.
- **Audit Logs**: History of admin decisions.

## 🛠️ Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Styling**: TailwindCSS v4
- **Components**: shadcn/ui, MagicUI, KokonutUI, Framer Motion
- **Icons**: Lucide-React / Tabler Icons
