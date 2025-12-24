Public User Screens
1. Main / Homepage

Purpose: First touchpoint; shows featured businesses and categories.
Sections/Components:

Featured Listings Carousel / Grid

Category Cards (clickable)

Optional Search Bar (minimal MVP)
States:

Loading → show skeleton placeholders

Empty → fallback message “No featured listings yet”

Success → render featured listings and categories
Interactions:

Click featured listing → Business Detail Page

Click category → Category Listing Page

2. Category List / Landing Page

Purpose: Browse all categories
Sections/Components:

Category Card Grid / List (name, icon, count of businesses optional)
States:

Loading → skeleton cards

Empty → “No categories available”

Success → show cards
Interactions:

Click category → Category Listing Page

3. Category Listing Page

Purpose: Shows all businesses within selected category
Sections/Components:

Business Card List/Grid (thumbnail, name, key info)

Filters / Sorting (optional MVP)
States:

Loading → skeleton cards

Empty → “No businesses in this category yet”

Success → render businesses
Interactions:

Click business → Business Detail Page

4. Business Detail Page

Purpose: Template-driven business info display
Sections/Components (mapped from category template):

Hero Section → name, cover image

Info Section → phone, address, hours

Menu Section → items + prices (if restaurant)

Gallery Section → images/documents
States:

Loading → skeleton sections

Error → “Listing unavailable”

Success → render all sections
Interactions:

Call / Visit buttons active if data exists

2️⃣ Business Owner Screens
1. Dashboard

Purpose: Central place to manage owned businesses
Sections/Components:

Business Table → name, status (draft/pending/approved/rejected), last updated

CTA → “Create New Listing”
States:

Loading → skeleton table

Empty → “You have no businesses, create one”

Success → render table with data
Interactions:

Click listing → Edit Listing

Click CTA → Create Listing

2. Create Listing

Purpose: Add new business
Sections/Components:

Form Sections → dynamically generated from category template (hero, info, menu, gallery, etc.)

File Upload → images, documents

Submit → sends to admin for approval
States:

Loading → spinner for file uploads

Validation Errors → required fields missing

Success → confirmation “Listing submitted for approval”
Interactions:

Save / Submit

Upload / remove files

3. Edit Listing

Purpose: Modify existing listing
Sections/Components: Same as Create Listing
States:

Pre-filled with existing data

Validation errors

Success → “Changes saved”
Interactions:

Save / Submit edits

3️⃣ Admin Screens
1. Admin Dashboard

Purpose: Quick overview of categories and pending listings
Sections/Components:

Summary Cards → number of pending listings, categories, total businesses

Quick Links → Category Management, Pending Listings Table, Audit Logs

2. Category Management

Purpose: Define templates for each category
Sections/Components:

Category Table → name, slug, sections

Edit / Add Category

Section Reorder / Required Toggle
States:

Loading → skeleton table

Empty → “No categories yet”

Success → render table
Interactions:

Add / Edit / Delete Category

Reorder / toggle required sections

3. Pending Listings Table

Purpose: Approve or reject business submissions
Sections/Components:

Table → business name, owner, category, status

Action Buttons → Approve / Reject

Quick Preview → business content sections
States:

Loading → skeleton table

Empty → “No pending listings”

Success → table populated
Interactions:

Approve / Reject → update status + log in listingReviews

4. Audit / Review Logs

Purpose: Track approvals / rejections
Sections/Components:

Table → business name, admin, decision, reason, date
States:

Loading → skeleton table

Empty → “No review logs yet”

Success → show logs
Interactions:

Filter by date / admin (optional MVP)