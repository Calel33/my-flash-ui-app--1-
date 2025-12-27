---
name: Next.js 16 Launchpad
description: >
  Equips Claude with the mental model, setup procedures, and routing/data
  workflows introduced in Next.js 16, including Turbopack-by-default builds,
  Cache Components, and the proxy.ts boundary so it can bootstrap, migrate, and
  advise teams confidently.
version: 1.0.0
trigger_keywords:
  - "next.js 16"
  - "turbopack"
  - "cache components"
  - "proxy.ts"
  - "create-next-app"
  - "react compiler"
license: MIT
---

# Next.js 16 Launchpad Skill

## Philosophy: Turbopack + Cache Components Execution

Next.js 16 replaces implicit behavior with explicit control. Turbopack becomes the
stable bundler (2-5× faster builds, up to 10× faster Fast Refresh), Cache
Components introduce `'use cache'` intent, and `proxy.ts` clarifies the network
boundary. Treat the framework as a layered system: Turbopack (build), Cache
Components (data), Server/Client Components (rendering), and proxy routing.

---

## When This Skill Activates

✅ Use when users mention Next.js 16, Turbopack performance, Cache Components,
proxy migration, App Router bootstrapping, or React 19.2 alignment.

❌ Do not activate for Pages Router, Next.js ≤15, or generic React questions.

---

## System Requirements & Baseline Setup

| Requirement | Version |
|------------|---------|
| Node.js | 20.9.0+ |
| TypeScript | 5.1.0+ |
| Browsers | Chrome/Edge/Firefox 111+, Safari 16.4+ |

**Upgrade or create:**

```
npx @next/codemod@canary upgrade latest
npm install next@latest react@latest react-dom@latest
npx create-next-app@latest my-app
```

Recommended `create-next-app` defaults: TypeScript, ESLint, Tailwind CSS, App
Router, Turbopack, alias `@/*`.

Baseline structure:

```
my-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── proxy.ts
│   └── ...
├── public/
├── next.config.ts
├── package.json
└── tsconfig.json
```

Minimal layout and page:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

```tsx
export default function Page() {
  return <h1>Hello, Next.js 16!</h1>
}
```

---

## Core Workflows

### Workflow 1: Install and Bootstrap

1. Verify Node 20.9+, TypeScript 5.1+, and browser targets.
2. Run codemod for upgrades or `npm install next@latest react@latest react-dom@latest` for manual installs.
3. Use `npx create-next-app@latest` and accept recommended defaults for Turbopack + App Router.
4. Initialize `package.json` scripts: `dev`, `build`, `start`, `lint`, `lint:fix`.
5. Scaffold `app/layout.tsx`, `app/page.tsx`, and `app/proxy.ts` to align with the router boundary.
6. Add Tailwind defaults or preferred styling system as needed.

### Workflow 2: Configuration Modernization

`next.config.ts` now supports native TypeScript:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
}

export default nextConfig
```

Key migrations:

| v15 | v16 |
|-----|-----|
| `experimental.turbopack` | Turbopack default |
| `experimental.ppr` | `cacheComponents` |
| `experimental.dynamicIO` | `cacheComponents` |
| `middleware.ts` | `proxy.ts` |
| `experimental.reactCompiler` | `reactCompiler` |

Steps:

1. Remove legacy `middleware.ts` and recreate logic inside `app/proxy.ts` for Node-only interception.
2. Drop `experimental.*` flags; enable `cacheComponents` and `reactCompiler` explicitly.
3. Keep ESLint outside `next build`; run `eslint` directly via scripts.
4. Confirm Turbopack options only if overrides are necessary; otherwise defaults apply.

### Workflow 3: Execution & Data Patterns

**Server Components** fetch data directly and stream in App Router:

```tsx
export default async function BlogPage() {
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()
  return <PostList posts={posts} />
}
```

Opt into Cache Components:

```tsx
import { cacheLife } from 'next/cache'

export default async function BlogPage() {
  'use cache'
  cacheLife('hours')
  const res = await fetch('https://api.example.com/posts')
  const posts = await res.json()
  return <PostList posts={posts} />
}
```

**Client Components** handle interactivity:

```tsx
'use client'
import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  )
}
```

Provide route states:

- `app/blog/error.tsx`: client component that receives `error` and `reset` props to retry.
- `app/blog/loading.tsx`: server component placeholder returning skeleton text.

---

## Key Primitives & Mental Models

1. **Turbopack:** Rust bundler, incremental compilation, built-in Fast Refresh, file system caching beta.
2. **Server Components:** default in `app/`, server-only execution, database-friendly, zero client JavaScript.
3. **Client Components:** `'use client'`, hydrate on client, support hooks and browser APIs.
4. **Cache Components:** `'use cache'` directive plus `cacheLife()` for explicit PPR caching.
5. **Proxy Boundary:** `app/proxy.ts` handles auth, rewrites, redirects before routing.
6. **Partial Pre-Rendering:** Build-time static shell, request-time streaming of dynamic segments via `<Suspense>`.

---

## Decision Guides

- **Should I enable Cache Components?** Enable when sections benefit from explicit freshness guarantees or PPR; skip for fully dynamic dashboards.
- **Where should auth logic live?** Use `proxy.ts` for cross-route interception; use route handlers for isolated API concerns.
- **When to mark a component `'use client'`?** Only when hooks, state, or browser APIs are required; keep presentational components server-side.
- **How to structure routes?** Follow file-system routing: nested `layout.tsx`, dynamic `[slug]` folders, and API routes under `app/api/*/route.ts`.

---

## Old vs New Quick Reference

| Area | v15 Behavior | v16 Behavior |
|------|--------------|--------------|
| Routing | `pages/*`, `_app.tsx` for layout | `app/*`, nested `layout.tsx`, slotting |
| Data | `getServerSideProps`, implicit cache | Async Server Components, explicit `'use cache'` |
| Middleware | `middleware.ts` (Edge) | `proxy.ts` (Node) |
| Bundler | Webpack default, Turbopack opt-in | Turbopack default, opt-out with `--webpack` |
| Caching API | `revalidateTag(tag)` | `cacheLife`, `cacheTag`, `revalidateTag(tag, profile)`, `updateTag` |
| Async Params | Sync `params`, `searchParams`, `cookies()` | Must `await` each Request API |

Use this table to orient migrations quickly before diving into details.

---

## Migration & Pitfall Playbook

1. **Turbopack adoption**
   - Remove legacy webpack config or add `--webpack` to `next build` if opting out.
   - For custom aliasing, use `turbopack.resolveAlias` inside `next.config.ts`.
2. **Async Request APIs**
   - Update every component signature to `export default async function Page({ params })` and `const { slug } = await params`.
   - Run `npx @next/codemod@canary async-request-api` for bulk fixes.
3. **`middleware.ts` → `proxy.ts`**
   - Rename file, export `proxy`, keep `matcher` for route scoping, remember Node-only runtime.
4. **Cache Components enablement**
   - Replace `experimental.ppr` with `cacheComponents: true`, then wrap dynamic sections with `<Suspense>` or `'use cache'`.
5. **Image query strings**
   - Configure `images.localPatterns` when local assets include `?v=` parameters.
6. **Deprecations sweep**
   - Remove `serverRuntimeConfig`, `publicRuntimeConfig`, `next lint`, and tilde Sass imports.

**Common fixes**
- Missing Suspense boundary: wrap dynamic children when Cache Components is on.
- Runtime data in cached scope: read cookies/headers first, pass into cached component props.
- `revalidateTag` failures: always supply a cache profile or switch to `updateTag` for immediate consistency.

---

## Advanced Workflows

### Cache Components with Lifecycle Profiles

```ts
// next.config.ts
const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    'product-catalog': { stale: 3600, revalidate: 7200, expire: 86400 },
  },
}
```

```tsx
export default async function ProductsPage() {
  'use cache'
  cacheLife('product-catalog')
  const products = await db.products.findMany()
  return <ProductGrid products={products} />
}
```

### Cache Tags + Server Actions

```tsx
// app/blog/page.tsx
'use cache'
cacheLife('hours')
cacheTag('blog-posts')
```

```ts
// app/actions.ts
'use server'
import { updateTag } from 'next/cache'

export async function createPost(data: PostData) {
  await db.posts.create(data)
  updateTag('blog-posts')
}
```

### Parallel and Streaming Composition

```tsx
const artist = fetch(...)
const albums = fetch(...)
const [artistData, albumsData] = await Promise.all([artist, albums])
```

Wrap each async section with `<Suspense>` to stream metrics, charts, and recent activity independently inside dashboards.

### Proxy-Gated Routes

```ts
export function proxy(request: NextRequest) {
  if (!request.cookies.get('auth-token') && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  return NextResponse.next()
}
```

### React Compiler Enablement

```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
}
```

Install `babel-plugin-react-compiler` to reduce manual memoization overhead when profiling shows frequent re-renders.

---

## Real-World Blueprints

### E-commerce Product Page
- Server component fetches product shell, reviews block uses `'use cache'` with `cacheTag('product-:id-reviews')`.
- Client `AddToCartButton` handles state, posts to `/api/cart`, and calls `router.refresh()` for server state sync.
- Multiple `<Suspense>` boundaries keep cart and reviews streaming independently.

### Blog with Server Actions
- Blog list caches via `cacheLife('hours')` + `cacheTag('blog-posts')`.
- `createPost` Server Action writes to DB, calls `updateTag('blog-posts')`, and redirects to the new slug for read-your-writes.

### Authenticated Dashboard
- `proxy.ts` checks session from cookies before `/dashboard` routes.
- `getSession` utility reads JWT on the server; dashboard page double-checks and calls `redirect('/login')` when missing.

Use these patterns as templates for most production flows (commerce, content, SaaS dashboards).

---

## Operational Checklist

### Must-Do Setup
- Node 20.9+, React 19.2+, TypeScript 5.1+.
- `npx create-next-app@latest` with recommended defaults.
- Turbopack default; only opt-out if custom webpack is unavoidable.
- ESLint via `eslint`/`eslint --fix`, not `next lint`.

### Migration Verifications
- Rename `middleware.ts` → `proxy.ts`, export `proxy`.
- Add `await` to `params`, `searchParams`, `cookies()`, `headers()`.
- Replace `experimental.*` flags with stable counterparts (`cacheComponents`, `reactCompiler`).
- Configure `images.localPatterns` for local assets with query strings.
- Remove `serverRuntimeConfig`/`publicRuntimeConfig` in favor of environment variables.

### Anti-Patterns to Avoid
- Mixing `'use cache'` scopes with runtime request APIs.
- Omitting `<Suspense>` when Cache Components is active.
- Keeping tilde-prefixed Sass imports under Turbopack.
- Attempting to run `proxy.ts` on Edge runtime.

---

## Execution Standards

1. Confirm runtime + tooling versions upfront.
2. Choose the workflow (bootstrap, config, migration, advanced patterns) that matches the user request.
3. Surface concrete commands, file paths, and code blocks that align with Next.js 16 defaults.
4. Highlight Turbopack/Cache implications for each recommendation and warn about pitfalls when users mention them.
5. Validate that guidance keeps App Router conventions, explicit caching semantics, and proxy boundaries intact.

---

## Performance, Security, and Deployment

**Performance Defaults**
- Keep Turbopack enabled; only opt-out for unsupported webpack plugins.
- Parallelize data fetches with `Promise.all` and leverage `<Suspense>` streaming boundaries.
- Use Cache Components for stable data, stream dynamic sections to keep TTFB low.
- Enable Turbopack file system cache on large repos for faster cold starts.

**Security Guardrails**
- Use the `server-only` package plus the React Taint API to prevent sensitive data leakage to Client Components.
- Keep auth logic in `proxy.ts`, validate input inside Server Actions, and gate environment variable exposure via `NEXT_PUBLIC_` prefix rules.
- Treat cookies/headers as runtime-only; extract before entering cached scopes.

**Deployment Checklist**
- Prefer Vercel for zero-config builds; enable `standalone` output for Docker/Node hosting.
- Monitor `next build` timing to ensure Turbopack maintains the 2-5× speedup.
- Use CDN-backed `public/` assets and configure Cache Component lifecycles to match downstream caching rules.

---

## Version & Resource Snapshot

| Release | Highlights |
|---------|------------|
| 16.0.10 | Current stable (Dec 2025) |
| 16.0.0 | Turbopack default, Cache Components, `proxy.ts`, React 19.2 |
| 15.x | Async Request APIs, Turbopack beta |

When diagnosing regressions, confirm the user’s exact minor version against this table.

---

## Bundled Resources

- `scripts/bootstrap-nextjs16.ps1`
  - Run to verify Node.js 20.9+, apply codemods, install latest Next.js packages, and scaffold `create-next-app` with TypeScript/Tailwind/Turbopack defaults.
  - Use `-SkipCodemod` when generating a brand-new project; otherwise let it upgrade existing code first.
- `assets/app-router-starter/`
  - Copy into a project to get reference implementations for `app/layout.tsx`, cache-aware `app/page.tsx`, auth-gated `/dashboard`, Suspense states, `proxy.ts`, and `next.config.ts` with `cacheComponents` + `reactCompiler` enabled.
  - Use as a vertical slice when demonstrating Cache Components + proxy behavior without re-deriving boilerplate.

---

## References

- `references/nextjs16-reference.md`: Core install/config notes and general checklists.
- `references/nextjs16-migration-playbook.md`: Old-vs-new tables, codemod commands, and detailed migration checklists.
- `references/nextjs16-advanced-patterns.md`: Streaming dashboards, Cache Component blueprints, proxy/auth patterns, and performance principles.
- Official Docs: https://nextjs.org/docs
- GitHub: https://github.com/vercel/next.js
- Source: `NEXTJS_16_COMPLETE_GUIDE.md` (lines 1-1614)
