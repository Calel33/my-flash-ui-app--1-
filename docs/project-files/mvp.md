🎯 Elite Local Directory — Final MVP Specification
1️⃣ Problem Definition

Core Pain:

Local businesses struggle to maintain accurate, structured, category-specific listings, causing customers to make decisions based on unreliable information.

Details:

Owners rely on fragmented platforms that are generic, inconsistent, and duplicative

Public users cannot reliably find accurate, structured business information

Critical moment: when a customer calls, visits, or compares businesses based on missing or incorrect data

No existing admin/trust layer → no guarantee of quality

2️⃣ Solution Definition

Core Solution:

A human-verified, category-structured local business directory where business owners manage their own listings and the public browses trusted, template-driven pages without accounts.

MVP Success:

Public users trust that listings are accurate, structured, and verified

Admin approval ensures quality

Owners fill template-driven forms matching public pages

Out of Scope:

Reviews, payments, messaging, ads, advanced SEO, multi-city scaling, social features

3️⃣ Core Loop
Business Owner submits listing → Admin reviews & approves → Listing appears on category page → Public user browses trusted information

4️⃣ Design Reference

Reference Products / Patterns:

Google Business Profile → public listings

Webflow CMS → template-driven content

Stripe / Supabase Dashboards → owner/admin management

UX Direction:

Public UI: Directory-like, content-first

Owner UI: Dashboard + structured forms

Admin UI: Moderation-first, table-heavy

Device Priority: Equal (Desktop + Mobile)

Constraints:
No infinite scroll, feed, chat, or social features; minimal responsive styling

5️⃣ Technical Stack

Frontend: Next.js 16 (App Router)

Auth: Clerk (Owner + Admin roles)

Database: Convex (document-based)

File Storage: Convex storage references

Hosting: Vercel

Libraries: shadcn/ui, react-hook-form, zod, TanStack Table

Maps (optional later): Mapbox / Google Maps

Constraints:
No Redux, GraphQL, microservices, or native apps

6️⃣ Database Model (Convex-Aligned, MVP + Featured Listings)
Collection	Purpose	Key Fields
users	Authenticated owners/admins	clerkUserId, role, email, createdAt
categories	Business types & page templates	name, slug, sections, createdAt, createdByAdminId
businesses	Business entities	ownerId, categoryId, name, phone, address, location, status, createdAt, updatedAt, isFeatured (boolean)
businessContent	Section-based dynamic content	businessId, sections (hero, info, menu, hours, gallery), images, documents, lastEditedAt
listingReviews	Admin approval logs	businessId, adminId, decision, reason, createdAt

Relationships:

User → Businesses (1 → many)

Category → Businesses (1 → many)

Business → BusinessContent (1 → 1)

Business → Reviews (1 → many)

Admin → Reviews (1 → many)

Featured Listings Logic:

Admin toggles isFeatured on approved businesses

Main Page queries businesses where isFeatured = true & status = approved

Optional ordering: by date or manual

Constraint: Only data required to create, approve, or browse listings exists

7️⃣ MVP Features

Must-Have Features:

Public User

Main Homepage (featured listings + categories)

Category List / Landing Page

Category Listing Page

Business Detail Page (template-driven sections)

Business Owner

Dashboard

Create / Edit Listing (section-based forms)

Upload images/documents

Submit for Admin Approval

Admin

Category Management (define sections, order, required vs optional)

Pending Listings Table

Audit / Review Logs

Approve / reject listings

Nice-to-Have (Excluded from MVP)

Reviews, payments, favorites, messaging, SEO automation, analytics, multi-city support, custom styling, push notifications

8️⃣ App Flow Document + Site Map
Public User Flow
[Main / Homepage (featured listings + categories)] 
      │
      ▼
[Category List Page]
      │
      ▼
[Category Listing Page (all businesses)]
      │
      ▼
[Business Detail Page (template-driven)]

Business Owner Flow
[Dashboard] → [Create New Listing / Edit Listing]

Admin Flow
[Admin Dashboard] → [Category Management]
                  → [Pending Listings Table]
                  → [Audit / Review Logs]

Full Site Map
/                   → Main / Homepage
/categories         → Category List Page
/categories/[slug]  → Category Listing Page
/business/[id]      → Business Detail Page
/dashboard          → Business Owner Dashboard
/dashboard/new      → Create New Listing
/dashboard/edit/[id]→ Edit Listing
/admin/categories   → Admin: Manage Categories
/admin/listings     → Admin: Pending Listings Table
/admin/logs         → Admin: Review Logs

9️⃣ Edge Case Handling

Missing required data → prevent publish

Network errors → show retry/error states

Empty states → clear CTA

Invalid slugs / IDs → 404 pages

File upload fails → error + retry

Rejected listing → owner sees reason, can edit

10️⃣ Deliverables for Dev / Designer

Public Pages: Main Homepage, Category List, Category Listing, Business Detail

Owner Pages: Dashboard, Create/Edit Listing (template-driven)

Admin Pages: Category Management, Pending Listings Table, Audit / Review Logs

Shared Components: Section renderers, forms, file uploads, status badges

Visual Flow Diagram: Main → Category → Listing → Detail → Owner/Admin flows