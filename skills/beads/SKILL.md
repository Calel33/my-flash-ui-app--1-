---
name: beads
description: This skill should be used when AI agents need persistent memory and task tracking across sessions using Beads, a git-based issue tracker. Triggers when agents work on complex multi-session tasks, need to break down epics into subtasks, discover bugs/TODOs during work, coordinate with other agents, or manage dependencies between issues.
---

# Beads - Persistent Memory for AI Agents

## Overview

Beads is a lightweight, git-based issue tracking system designed specifically for AI coding agents. It solves the fundamental amnesia problem where agents forget context between sessions and abandon markdown plans. Beads provides a queryable, dependency-aware graph database that persists work across sessions, enabling agents to manage complex, long-horizon tasks effectively.

## When to Use This Skill

Use Beads when:
- Working on tasks that span multiple sessions (prevents context loss)
- Breaking down complex features into dependency-ordered subtasks
- Discovering bugs or TODOs during implementation (need space to record them)
- Coordinating work with other agents or across git branches
- Managing blocked work and dependency chains
- Tracking issues across multiple repositories during migrations

Do NOT use Beads for:
- Simple single-session tasks with no dependencies
- Pure conversational interactions
- Tasks with no need for persistent state

## Core Workflow for AI Agents

### Session Start Protocol

At the beginning of every session, discover ready work:

```bash
# Find highest-priority work with no blockers
bd ready --json | jq '.[0]'
```

**Response handling:**
```json
{
  "id": "bd-a1b2",
  "title": "Fix auth validation bug",
  "priority": 1,
  "status": "open",
  "type": "bug",
  "dependencies": []
}
```

If no ready work exists, check for blocked issues:
```bash
bd blocked --json
```

### Starting Work

Before starting, verify issue details and check for blockers:

```bash
# Get full issue context
bd show bd-a1b2 --json | jq '{title, description, dependencies, priority}'

# Update status to in_progress
bd update bd-a1b2 --status in_progress --json
```

**Critical check:** Examine dependencies array for any `"type": "blocks"` entries with `"status": "open"` or `"status": "in_progress"`. These are active blockers—consider resolving blockers first or documenting why proceeding anyway.

### During Work: Filing Discovered Issues

When discovering bugs, TODOs, or follow-up work during implementation:

```bash
# File the discovered issue
bd create "SQL injection in login endpoint" -t bug -p 0 --json

# Returns: {"id": "bd-f14c", ...}

# Link back to parent with discovered-from relationship
bd dep add bd-f14c bd-a1b2 --type discovered-from
```

**Why discovered-from matters:** This dependency type auto-inherits the parent's `source_repo` field, ensuring cross-repo work tracking stays organized during migrations.

### Completing Work

Close issues with descriptive reasons for audit trail:

```bash
bd close bd-a1b2 --reason "Implemented parameterized queries, added input validation tests"
```

**If work is blocked by discovered issues:**
```bash
# Mark as blocked instead of closing
bd update bd-a1b2 --status blocked

# The blocking relationship should already exist from discovered-from link
bd dep add bd-f14c bd-a1b2 --type blocks
```

### Session End Protocol

Sync changes to git for cross-session persistence:

```bash
# Force immediate sync (bypasses 5s debounce)
bd sync

# Commit and push (other agents/sessions will auto-import)
git add .beads/issues.jsonl
git commit -m "chore: completed bd-a1b2, filed bd-f14c"
git push
```

## Dependency Management

### Dependency Types

Beads supports four dependency types with distinct semantics:

1. **blocks** - Hard blocker (A blocks B → B cannot start until A completes)
   ```bash
   bd dep add bd-a1b2 bd-f14c --type blocks
   # bd-a1b2 must complete before bd-f14c can start
   ```

2. **related** - Soft relationship (informational, non-blocking)
   ```bash
   bd dep add bd-a1b2 bd-f14c --type related
   # bd-a1b2 and bd-f14c are connected but independent
   ```

3. **parent-child** - Hierarchical (use dot notation for auto-linking)
   ```bash
   bd create "Q4 Auth Epic" -t epic -p 1
   # Returns: bd-a1b2
   
   bd create "OAuth integration" -p 1 --parent bd-a1b2
   # Returns: bd-a1b2.1 (auto-linked to parent)
   ```

4. **discovered-from** - Issue discovered during work (auto-inherits source_repo)
   ```bash
   bd dep add bd-f14c bd-a1b2 --type discovered-from
   # bd-f14c was discovered while working on bd-a1b2
   ```

### Breaking Down Epics

For complex multi-part tasks, use hierarchical issues:

```bash
# Create epic
bd create "Implement authentication system" -t epic -p 1 --json
# Returns: bd-a1b2

# Create subtasks with hierarchical IDs
bd create "Add OAuth provider" -p 1 --parent bd-a1b2 --json
# Returns: bd-a1b2.1

bd create "Implement JWT tokens" -p 1 --parent bd-a1b2 --json
# Returns: bd-a1b2.2

bd create "Add refresh token logic" -p 1 --parent bd-a1b2 --json
# Returns: bd-a1b2.3

# Add sequential blocking (OAuth → JWT → Refresh)
bd dep add bd-a1b2.1 bd-a1b2.2 --type blocks
bd dep add bd-a1b2.2 bd-a1b2.3 --type blocks

# Visualize dependency tree
bd dep tree bd-a1b2
```

### Checking Dependencies

Before starting work, visualize the full dependency graph:

```bash
# Tree visualization (human-readable)
bd dep tree bd-a1b2

# JSON for programmatic analysis
bd dep tree bd-a1b2 --json | jq '.tree'
```

**For complex graphs, use the dependency analyzer script:**
```bash
# Detect circular dependencies (these cause deadlocks!)
python scripts/dependency_analyzer.py cycles

# Find all blocked issues
python scripts/dependency_analyzer.py blockers

# Find orphaned issues (missing parents)
python scripts/dependency_analyzer.py orphans
```

## Query Patterns for Agents

### Finding Work by Priority

```bash
# Critical work only (P0)
bd ready --priority-min 0 --priority-max 0 --json

# High-priority work (P0-P1)
bd ready --priority-max 1 --json

# Clear backlog (oldest first, ignore priority)
bd ready --sort oldest --json
```

### Filtering by Labels

```bash
# Backend work with urgent label
bd list --status open --label backend,urgent --json

# Any security or auth work (OR logic)
bd list --status open --label-any security,auth --json
```

### Cross-Repository Work (Multi-Repo Migrations)

```bash
# Find all issues from specific repo
bd list --source-repo "github.com/org/api-service" --json

# Find cross-repo work (labeled 'migration')
bd list --label migration --status open --json | \
  jq 'group_by(.source_repo)'
```

### Time-Based Queries

```bash
# Issues created this week
bd list --created-after $(date -d '7 days ago' -I) --json

# Stale issues (older than 90 days)
bd list --created-before $(date -d '90 days ago' -I) --json
```

## Using Bundled Scripts

### agent_workflow.py - Automated Session Management

**Interactive session (recommended for learning):**
```bash
python scripts/agent_workflow.py session
```

This script guides through:
1. Finding ready work
2. Checking blockers
3. Starting work
4. Filing discovered issues
5. Completing work
6. Git sync reminder

**Programmatic usage in agent code:**
```python
import subprocess
import json

# Find and start next work
result = subprocess.run(
    "python scripts/agent_workflow.py start",
    shell=True,
    capture_output=True
)

# Complete work
subprocess.run(
    "python scripts/agent_workflow.py complete bd-a1b2 --reason 'Implementation done'",
    shell=True
)

# File discovered bug
subprocess.run(
    "python scripts/agent_workflow.py discover bd-a1b2 'Memory leak detected' --priority 0",
    shell=True
)
```

### dependency_analyzer.py - Graph Analysis

**Check for circular dependencies (run periodically!):**
```bash
python scripts/dependency_analyzer.py cycles
```

**Visualize dependency tree:**
```bash
python scripts/dependency_analyzer.py tree bd-a1b2
```

**Find all blocked issues:**
```bash
python scripts/dependency_analyzer.py blockers
```

**Detect orphaned children:**
```bash
python scripts/dependency_analyzer.py orphans
```

## JSON Output Handling

All Beads commands support `--json` for structured output. Always use `--json` when parsing output programmatically.

**Example: Parse ready work in bash**
```bash
ISSUE_ID=$(bd ready --json | jq -r '.[0].id')
ISSUE_TITLE=$(bd ready --json | jq -r '.[0].title')
PRIORITY=$(bd ready --json | jq -r '.[0].priority')

echo "Starting work on [$ISSUE_ID] $ISSUE_TITLE (P$PRIORITY)"
bd update "$ISSUE_ID" --status in_progress
```

**Example: Parse in Python**
```python
import json
import subprocess

def get_ready_work():
    result = subprocess.run(
        "bd ready --json",
        shell=True,
        capture_output=True,
        text=True
    )
    issues = json.loads(result.stdout)
    return issues[0] if issues else None

issue = get_ready_work()
if issue:
    print(f"Next work: {issue['id']} - {issue['title']}")
```

## Setup and Installation

### First-Time Setup

If Beads is not yet initialized in the project:

```bash
# Install Beads (choose one method)
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
# OR: npm install -g @beads/bd
# OR: brew install steveyegge/beads/bd

# Initialize in project
cd /path/to/project
bd init

# Install git hooks (recommended for auto-sync)
# Answer "yes" when bd init prompts for hook installation

# Verify setup
bd info
```

### For OSS Contributors (Fork Workflow)

```bash
bd init --contributor
# Issues stay in your fork, never pushed upstream
```

### For Team Collaboration

```bash
bd init --team

# Verify git merge driver is configured
git config merge.beads.driver
# Should output: bd merge %A %O %A %B
```

### For Protected Main Branches

```bash
bd init --branch beads-metadata
# Creates separate metadata branch for issue updates
```

## Common Pitfalls and Solutions

### Issue Not Found After git pull

**Symptom:** `bd show bd-a1b2` fails after pulling changes.

**Cause:** JSONL imported but cache not refreshed.

**Fix:**
```bash
bd sync
```

### Circular Dependency Deadlock

**Symptom:** Issues remain blocked indefinitely, no progress possible.

**Cause:** Circular dependency (A blocks B, B blocks A).

**Fix:**
```bash
# Detect cycles
python scripts/dependency_analyzer.py cycles

# Output: Cycle detected: bd-a1b2 → bd-f14c → bd-a1b2

# Break cycle by removing one edge
bd dep remove bd-f14c bd-a1b2

# Verify fix
python scripts/dependency_analyzer.py cycles
```

### Duplicate Issues After Merge (Pre-v0.20.1)

**Symptom:** Two branches created issues with same ID, merge creates duplicates.

**Cause:** Using sequential IDs (bd-1, bd-2) instead of hash IDs.

**Fix:**
```bash
# Upgrade to v0.20.1+
curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash

# Migrate to hash-based IDs
bd migrate --dry-run  # Preview
bd migrate            # Execute
```

### Orphaned Child Issues

**Symptom:** Child issues (bd-a1b2.1) exist but parent (bd-a1b2) is missing.

**Cause:** Parent deleted but children remain.

**Fix:**
```bash
bd import --orphan-handling resurrect
# Auto-creates parent tombstones
```

## Advanced Features

### Agent Mail (Real-Time Sync)

For sub-100ms synchronization between agents (vs 2-5s git sync):

```bash
# Enable Agent Mail
bd config set agent_mail.enabled true
bd config set agent_mail.url wss://your-server.com:8080

# Create issue → other agents see it in <100ms
bd create "Urgent fix" -p 0
```

See `references/advanced_workflows.md` for Agent Mail setup guide.

### Memory Compaction

For large databases (>50MB JSONL):

```bash
# Auto-compact old completed issues
bd compact --auto --all

# Compact issues older than 90 days
bd compact --status closed --older-than 90d
```

### Multi-Repo Tracking

For migrations or cross-repo work:

```bash
# Annotate source repository
bd create "Update API contract" -p 1 --source-repo "github.com/org/api-service"

# Query by source repo
bd list --source-repo "github.com/org/api-service" --json

# Discovered work auto-inherits parent's source_repo
bd dep add bd-f14c bd-a1b2 --type discovered-from
```

## Reference Documentation

### CLI Command Reference

For detailed command syntax, options, and JSON output formats:
```bash
# Read the CLI reference
cat references/cli_reference.md
```

Key sections:
- Issue management commands (create, list, show, update, close)
- Dependency management (dep add, dep remove, dep tree, dep cycles)
- Query commands (ready, blocked)
- Sync commands (sync, import, export)

### Advanced Workflows

For complex patterns like protected branches, Agent Mail, CI/CD integration:
```bash
# Read advanced workflows guide
cat references/advanced_workflows.md
```

Key sections:
- Multi-repo workflows with source_repo tracking
- Protected branch workflows (separate metadata branch)
- Agent Mail setup (real-time <100ms sync)
- Memory compaction strategies
- CI/CD integration examples (GitHub Actions, GitLab CI)

## Best Practices for AI Agents

1. **Always use `--json` for parsing** - Never parse human-readable output
2. **Check blockers before starting work** - Use `bd show <id> --json | jq .dependencies`
3. **Link discovered work** - Use `discovered-from` dependency type
4. **Close with reasons** - Provide audit trail: `bd close <id> --reason "..."`
5. **Sync frequently** - Run `bd sync` before ending sessions
6. **Check for cycles periodically** - Run `python scripts/dependency_analyzer.py cycles`
7. **Use labels for organization** - Enable flexible filtering: `--label backend,urgent`
8. **Query ready work at session start** - Don't guess what to work on: `bd ready --json`
9. **Visualize before acting** - Use `bd dep tree` for complex dependencies
10. **Handle orphans gracefully** - Use `--orphan-handling resurrect` when importing

## Troubleshooting

### Health Check

```bash
bd doctor
```

Checks for:
- Circular dependencies
- Orphaned issues
- Daemon status
- Database integrity
- Git merge driver configuration

### Daemon Issues

```bash
# Restart daemon
bd daemons restart $(pwd)

# View logs
bd daemons logs $(pwd) -n 100

# Kill all daemons (clean slate)
bd daemons killall
```

### Database Verification

```bash
# Check schema version and format
bd info --schema --json

# Verify JSONL sync
ls -lh .beads/issues.jsonl
bd list --json | jq length  # Should match issue count
```

## Quick Reference Card

```bash
# === Session Start ===
bd ready --json | jq '.[0]'              # Find work
bd show <id> --json                       # Get details
bd update <id> --status in_progress       # Start work

# === During Work ===
bd create "Bug" -t bug -p 0 --json       # File discovered issue
bd dep add <new> <parent> --type discovered-from  # Link to parent

# === Session End ===
bd close <id> --reason "..."             # Complete work
bd sync                                   # Force sync
git add .beads/issues.jsonl && git commit && git push

# === Dependency Management ===
bd dep tree <id>                         # Visualize tree
bd dep add <source> <target> --type blocks  # Add blocker
python scripts/dependency_analyzer.py cycles  # Check cycles

# === Queries ===
bd ready --priority-max 1 --json         # P0-P1 work
bd blocked --json                        # Blocked issues
bd list --label backend --json           # Filtered list

# === Health Checks ===
bd doctor                                # Full health check
bd dep cycles                            # Circular dependency check
bd daemons restart $(pwd)                # Restart daemon
```
