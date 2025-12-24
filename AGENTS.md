# AGENTS.md · System Rules Guide for AI Agents

## Overview

This guide translates `systemrule.md` into actionable instructions for AI agents working in this project. Follow these rules strictly to maintain code quality, design consistency, and system integrity.

---

## 1. Environment Context

- **OS**: Windows
- **Shell**:
- **Critical Requirement**: All rules in this file MUST be followed without exception
### Always-rules:

### Path1code search|
***This is default***
rules:
  tool_selection_for_code_search:
    critical_guidelines:
      - description: "ALWAYS use codebase-retrieval MCP tool as your PRIMARY tool for code search."
      - description: "DO NOT use Bash commands (find, grep, ag, rg, etc.) or Grep tool for semantic code understanding."
      - description: "The codebase-retrieval MCP tool uses advanced semantic search and is specifically designed for code understanding."
      - description: "Bash/Grep are only appropriate for exact string matching of non-code content (like error messages, config values, or log entries)."
      - description: "When in doubt between Bash/Grep and codebase-retrieval MCP, ALWAYS choose codebase-retrieval MCP."

  preliminary_tasks_and_planning:
    requirement: "Before starting to execute a task, ALWAYS use the codebase-retrieval MCP tool to make sure you have a clear understanding of the task and the codebase."

  making_edits:
    protocol:
      - "Before editing a file, ALWAYS first call the codebase-retrieval MCP tool, asking for highly detailed information about the code you want to edit."
      - "Ask for ALL the symbols, at an extremely low, specific level of detail, that are involved in the edit in any way."
      - "Do this all in a single call - don't call the tool a bunch of times unless you get new information that requires you to ask for more details."
    scenarios:
      method_call: "If you want to call a method in another class, ask for information about the class and the method."
      class_instance: "If the edit involves an instance of a class, ask for information about the class."
      class_property: "If the edit involves a property of a class, ask for information about the class and the property."
    general_instruction: "If several of the above apply, ask for all of them in a single call. When in any doubt, include the symbol or object."


### PATH2 Code search
The best code search combines mgrep with grep.

### Code base search
Use grep (or ripgrep) for... Exact Matches, Symbol tracing, Refactoring, Regex

Use mgrep for...Intent Search, Code exploration, Feature discovery, Onboarding

- id: graphite_stacked_diffs
    trigger: "code changes during development phase"
    condition: "When creating or updating code beyond trivial edits"
    action: "Use Graphite stacked diff workflow (gt create/modify/submit/sync) instead of raw git commit/push"
    tool: "gt (Graphite CLI)"
    purpose: "Ensure all work is organized as small, ordered stacked diffs"

    IMPORTANT: Use the Read tool WITHOUT limit/offset parameters to read entire files

---

## 2. Core Principles (Always Apply)

### KISS (Keep It Simple, Stupid)
- Prioritize straightforward solutions over clever or complex ones
- Avoid over-engineering
- Choose readability over cleverness

### YAGNI (You Aren't Gonna Need It)
- Don't implement features unless needed NOW
- Avoid speculative architecture
- Build for current requirements, not hypothetical future ones

### Component-First
- Components should be reusable, composable, and self-contained
- Co-locate styles, tests, and logic with components
- Follow vertical slice architecture

### Performance By Default
- Focus on clean, readable code
- Let React 19's compiler handle optimizations
- Only memoize when profiling reveals actual issues

---

## 3. File Editing Protocol (CRITICAL)

Before editing ANY file:

1. ✅ **Check existing code** — Read the file completely
2. ✅ **Double-check line numbers** — Verify exact location
3. ✅ **Read lines before editing** — Understand context
4. ✅ **Preserve existing functionality** — Never break working code
5. ✅ **Double-check after edits** — Verify changes are correct

**NEVER delete existing code without explicit instruction.**

---

## 4. Code Structure Rules

### File Organization
- **One responsibility per file** — Single concern only
- **Max file length: 500 lines** — Strictly enforced
- **Modular design** — Break large files into smaller modules
- **Relative imports** — Use relative paths within domains

### Architecture Patterns
- **Vertical slice architecture** — Complete features in isolated slices
- **Composition over inheritance** — Prefer composition patterns
- **Fail-fast validation** — Validate early, fail explicitly

---

## 5. Design System (MANDATORY)

### Token-Only Rule
- **ALWAYS** use design system tokens for:
  - Colors
  - Typography
  - Spacing
  - Border radius
  - Shadows
- **NEVER** use hard-coded style values
- **Exception**: None. Update design tokens if needed, never inline styles.

### Design System Location
- Tokens stored in: `design -system/`
- Reference: `design -system/design.md`

---

## 6. Graphite Workflow (Stacked Diffs)

The Graphite workflow enables efficient code review and incremental development through stacked pull requests.

### Core Principles

#### 1. Small, Incremental Changes
- Break features into small, logically cohesive diffs (typically 200-400 lines)
- Each diff should represent a single, reviewable concept
- Reduces cognitive load on reviewers and enables faster feedback


## 7. AI Agent Behavior

### Non-Negotiable Rules
- ❌ **No assumptions** — Verify everything
- ❌ **No hallucinated functions** — Only use existing APIs/functions
- ✅ **Confirm paths and modules** — Check before using
- ❌ **Never delete existing code** — Preserve all functionality
- ✅ **Always follow defined rules** — No exceptions

---

## 8. Implementation Workflow

### Pre-Implementation
1. **Follow Context Agent plans** — Always adhere to generated implementation plans
2. **Never change without context** — Require valid context and plan
3. **Maintain existing functionality** — All current features must continue working
4. **Ensure backwards compatibility** — No breaking changes

### During Implementation
- **Complete all related updates** — No partial implementations allowed
- **Write modular, maintainable code** — Avoid monolithic files
- **Check other domains first** — Prevent duplicate logic
- **Reuse utilities** — Don't reinvent existing solutions
- **Maintain pattern consistency** — Follow established patterns

### Integration Checklist (Before Completing)
- [ ] Fully integrated into system structure?
- [ ] All imports, styles, modules updated?
- [ ] Would this work in production (not isolated)?
- [ ] All connected systems updated (routing, state, dependencies, styles)?

---

## 9. Change Propagation Protocol

**Before making ANY change:**

### Step 1: Identify Dependencies
Ask: "What other parts of the system read, write, or depend on this data/functionality?"

### Step 2: Map All Affected Systems
List ALL dependent:
- Files
- Components
- Routes
- State management
- Styles
- Tests

### Step 3: Update Everything Together
Make changes to ALL dependent systems in the **same commit/PR**

### Step 4: Test End-to-End
Verify the complete flow works across all systems

---


## 11. Common Pitfalls (AVOID)

- ❌ Duplicate functionality across domains
- ❌ Overwriting tests
- ❌ Modifying core frameworks without permission
- ❌ Adding dependencies without checking existing ones
- ❌ Partial implementations
- ❌ Breaking backwards compatibility
- ❌ Hard-coded styles (use design tokens!)

---

## 12. Development Workflow

### Preferred Approach
1. **Test-first development** — Write tests before implementation
2. **Think before architecting** — Plan thoroughly
3. **Break tasks into smaller units** — Manageable pieces
4. **Validate before building** — Confirm approach is correct

---



## 14. Quick Reference Checklist

Before completing any task, verify:

- [ ] Followed all systemrule.md requirements
- [ ] Used design system tokens (no hard-coded styles)
- [ ] File ≤850 lines
- [ ] One responsibility per file
- [ ] All dependencies updated
- [ ] Backwards compatible
- [ ] Tests passing
- [ ] Integration checklist complete
- [ ] Confidence score provided (if complex task)

---


## Version

- **systemrule.md**: version 1
- **Type**: always_apply
- **Last Updated**: Based on systemrule.md unified system rules

---

**Remember**: These rules exist to maintain code quality, design consistency, and system integrity. Follow them strictly without exception.
