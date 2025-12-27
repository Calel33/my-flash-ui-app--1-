---
name: react-19
description: Comprehensive guide for React 19 development. Use this skill when building applications with React 19, implementing Server Components, Server Actions, form handling with useActionState, optimistic updates with useOptimistic, or migrating from React 18. Covers installation, core patterns, security best practices, and practical workflows.
---

# React 19

## Overview

React 19 (stable since December 5, 2024) represents an evolutionary paradigm shift focused on simplifying async operations, improving server-side rendering, and enhancing developer experience. This skill provides comprehensive guidance for building modern React 19 applications using Actions, Server Components, and new hooks.

## When to Use This Skill

Use this skill when:

- Building new React 19 applications
- Implementing async form handling with automatic pending/error states
- Using Server Components for server-side rendering
- Creating optimistic UI updates for better user experience
- Migrating from React 18 to React 19
- Working with Server Actions for full-stack form handling
- Need guidance on React 19 security best practices

## Core Concepts

### Hybrid Client-Server Mental Model

React 19 introduces three execution boundaries:

| Component Type | Runs Where | Has State | Access to |
|---------------|------------|-----------|-----------|
| **Server Component** | Server | No | Database, FS, Secrets |
| **Client Component** | Browser | Yes | DOM, Browser APIs |
| **Server Action** | Server | No | Databases, APIs |

### Key Primitives

1. **Actions** - Async functions in transitions with automatic pending/error handling
2. **Server Components (RSC)** - Zero-JS server-rendered components
3. **Server Actions** - Server-side mutations callable from client
4. **Suspense Boundaries** - Async rendering boundaries
5. **Transitions** - Non-urgent state updates

### Convention Over Configuration

- `"use server"` directive = Server Action
- `"use client"` directive = Client Component  
- No directive in RSC environment = Server Component
- `async` component = Suspends automatically

---

## 5 Core Workflows

### 1. Form Handling with useActionState

**Use for:** Forms with async submissions, automatic pending states, error handling

```javascript
'use client';
import { useActionState } from 'react';

function SignupForm() {
  const [state, formAction, isPending] = useActionState(
    async (previousState, formData) => {
      const email = formData.get('email');
      const error = await createUser(email);
      return error ? { error } : null;
    },
    { error: null }
  );

  return (
    <form action={formAction}>
      <input type="email" name="email" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing up...' : 'Sign Up'}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

**Benefits:** Automatic pending state tracking, form reset on success, progressive enhancement

---

### 2. Optimistic Updates with useOptimistic

**Use for:** Instant UI feedback (likes, comments, toggles)

```javascript
'use client';
import { useOptimistic } from 'react';

function CommentList({ comments, addComment }) {
  const [optimisticComments, addOptimisticComment] = useOptimistic(
    comments,
    (current, newComment) => [...current, { ...newComment, pending: true }]
  );

  async function submitComment(formData) {
    const newComment = { id: Date.now(), text: formData.get('comment') };
    addOptimisticComment(newComment);
    await addComment(newComment);
  }

  return (
    <div>
      {optimisticComments.map(comment => (
        <div key={comment.id} className={comment.pending ? 'opacity-50' : ''}>
          {comment.text}
        </div>
      ))}
      <form action={submitComment}>
        <input name="comment" placeholder="Add a comment..." />
        <button type="submit">Post</button>
      </form>
    </div>
  );
}
```

**Benefits:** UI updates immediately, automatically reverts on error, better perceived performance

---

### 3. Server Components + Server Actions

**Use for:** SEO-critical content, direct database access, reducing JS bundle

```javascript
// app/actions.js
'use server';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';

export async function createPost(formData) {
  const title = formData.get('title');
  
  if (!title || title.length < 3) {
    return { error: 'Title must be at least 3 characters' };
  }
  
  await db.posts.create({ title, authorId: await getCurrentUserId() });
  revalidatePath('/posts');
}
```

```javascript
// app/new-post/page.js
'use client';
import { useActionState } from 'react';
import { createPost } from './actions';

export default function NewPostForm() {
  const [state, formAction, isPending] = useActionState(createPost, {});
  
  return (
    <form action={formAction}>
      <input name="title" placeholder="Post title" />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Publishing...' : 'Publish'}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

**Benefits:** No API routes needed, direct database access, type-safe, automatic serialization

---

### 4. Streaming with Suspense

**Use for:** Dashboards, pages with multiple data sources, progressive rendering

```javascript
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="dashboard">
      <h1>Analytics Dashboard</h1>
      <div className="grid">
        <Suspense fallback={<CardSkeleton />}>
          <RevenueCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <UsersCard />
        </Suspense>
      </div>
    </div>
  );
}

async function RevenueCard() {
  const revenue = await db.analytics.getRevenue();
  return <div className="card">{revenue}</div>;
}
```

**Benefits:** Fast content displays first, sections load independently, no waterfalls

---

### 5. Conditional Resource Loading with use()

**Use for:** Conditional data loading, reading context after early returns

```javascript
import { use } from 'react';

function UserProfile({ userPromise }) {
  const user = use(userPromise); // Can be called conditionally!
  if (!user) return null;
  
  const theme = use(ThemeContext);
  return <div style={{ color: theme.color }}>{user.name}</div>;
}

function App() {
  const userPromise = fetchUser(userId);
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserProfile userPromise={userPromise} />
    </Suspense>
  );
}
```

**Benefits:** Can be called conditionally, in loops, or after early returns

---

## Installation & Setup

```bash
# Install React 19
npm install react@19.2.1 react-dom@19.2.1

# TypeScript types
npm install --save-dev @types/react@19.0.0 @types/react-dom@19.0.0
```

### Required: Enable Modern JSX Transform

```json
// tsconfig.json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

### Recommended Project Init

```bash
# Next.js 15+ (recommended)
npx create-next-app@latest

# Vite
npm create vite@latest my-react-app -- --template react-ts
```

---

## Security Best Practices

### 1. Always Authenticate Server Actions

```javascript
'use server';
import { getCurrentUser } from '@/lib/auth';

export async function deleteUser(userId) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error('Unauthorized');
  if (currentUser.id !== userId && !currentUser.isAdmin) {
    throw new Error('Forbidden');
  }
  await db.users.delete(userId);
}
```

### 2. Never Expose Secrets to Client

```javascript
'use server';
export async function fetchData() {
  // Read secret inside function, not module scope
  const API_SECRET = process.env.API_SECRET;
  return fetch('https://api.example.com', {
    headers: { 'Authorization': `Bearer ${API_SECRET}` }
  });
}
```

### 3. Always Sanitize User Input

```javascript
import DOMPurify from 'isomorphic-dompurify';

async function UserProfile({ userId }) {
  const user = await db.users.findById(userId);
  const sanitizedBio = DOMPurify.sanitize(user.bio);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedBio }} />;
}
```

### 4. Validate All Inputs

```javascript
import { z } from 'zod';

export async function updateUser(formData) {
  'use server';
  const result = z.object({
    email: z.string().email(),
    age: z.number().min(0).max(150)
  }).safeParse({ email: formData.get('email'), age: Number(formData.get('age')) });
  
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }
}
```

**For comprehensive security guidance, see:** `references/security-guide.md`

---

## Common Pitfalls

### Actions Must Be Wrapped in Transitions

```javascript
// ✅ Use useActionState (automatic transition)
const [state, formAction, isPending] = useActionState(updateData, {});

// ✅ Or use useTransition
const [isPending, startTransition] = useTransition();
startTransition(async () => { await updateData(); });
```

### Server Components Cannot Use Client Hooks

```javascript
// ❌ Wrong
async function MyComponent() {
  const [state, setState] = useState(0); // Error!
}

// ✅ Correct - Mark as Client Component
'use client';
function MyComponent() {
  const [state, setState] = useState(0);
}
```

### useRef Requires an Argument

```javascript
// ❌ Wrong: const ref = useRef();
// ✅ Correct
const ref = useRef(null);
const ref = useRef<HTMLDivElement>(null); // TypeScript
```

**For complete migration guide, see:** `references/migration-patterns.md`

---

## Migration from React 18

### Quick Migration Steps

1. **Update to React 18.3 first** (fix all warnings)
2. **Update to React 19.2.1**
3. **Run codemods:** `npx codemod@latest react/19/migration-recipe`
4. **Fix TypeScript:** `npx types-react-codemod@latest preset-19 ./src`
5. **Test thoroughly**

### Breaking Changes

- `ReactDOM.render` removed → Use `createRoot`
- `PropTypes` removed → Use TypeScript
- String refs removed → Use callback refs
- `forwardRef` deprecated → Use `ref` as prop
- `useRef()` requires argument → `useRef(null)`

**For detailed upgrade checklist, see:** `references/upgrade-checklist.md`

---

## Quick Reference

### New Hooks

| Hook | Purpose | Use When |
|------|---------|----------|
| `useActionState` | Form state management | Building forms with async submissions |
| `useOptimistic` | Optimistic updates | Need instant UI feedback |
| `use()` | Read promises/context | Conditional data loading |
| `useTransition` | Non-urgent updates | Wrapping async actions |

**For detailed hook documentation, see:** `references/hooks-api.md`

### Component Types

| Type | Directive | Can Use State | Access |
|------|-----------|---------------|--------|
| Server Component | None (default) | No | Database, FS, Secrets |
| Client Component | `"use client"` | Yes | DOM, Browser APIs |
| Server Action | `"use server"` | No | Databases, APIs |

### When to Use What

| Task | React 19 Way |
|------|--------------|
| **Forms** | `useActionState` + Server Actions |
| **Optimistic UI** | `useOptimistic` |
| **Data fetching** | Server Components with `async/await` |
| **Refs** | `ref` as regular prop |
| **Progressive rendering** | Suspense boundaries |

---

## Reference Documentation

This skill includes comprehensive reference guides:

### references/hooks-api.md
Complete hook documentation with examples:
- `useActionState` - Form state management
- `useOptimistic` - Optimistic UI updates
- `use()` - Promise/context reading
- `useTransition` - Non-urgent updates
- Comparison tables and best practices

### references/migration-patterns.md
Detailed migration guide:
- All breaking changes with before/after code
- Step-by-step migration process
- Codemod commands
- Common pitfalls and solutions
- TypeScript migration guide
- Framework-specific migrations

### references/advanced-examples.md
Production-ready examples:
- Full-stack todo app with Server Actions
- Streaming dashboard with Suspense
- Advanced form with file upload
- Real-time collaborative comments
- Progressive search with debouncing

### references/security-guide.md
Comprehensive security guidance:
- CVE-2025-55182 details and mitigations
- 5 security gotchas with secure patterns
- Complete security checklist
- Framework-specific patches

### references/upgrade-checklist.md
Step-by-step upgrade procedures:
- Pre-upgrade checklist (React 18.3)
- React 19 upgrade steps
- Testing procedures
- Framework-specific updates
- Rollback plan

---

## Resources

- **React 19 Docs:** https://react.dev
- **Next.js 15 Docs:** https://nextjs.org/docs
- **Community:** https://react.dev/community

**Skill Version:** 2.0  
**Last Updated:** 2025-12-14
