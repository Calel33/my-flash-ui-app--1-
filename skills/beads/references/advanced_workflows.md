# Advanced Beads Workflows

This reference document covers advanced patterns for AI agents working with Beads.

## Multi-Repo Workflows

### Source Repository Tracking

When working across multiple repositories, use the `source_repo` field to track issue provenance:

```bash
# Create issue with source repo annotation
bd create "Update API contract" -p 1 --source-repo "github.com/org/api-service"

# Query issues by source repo
bd list --source-repo "github.com/org/api-service" --json
```

### Discovered Work Pattern

Issues discovered during work automatically inherit the parent's `source_repo`:

```bash
# Agent working on bd-a1b2 (from api-service repo)
bd update bd-a1b2 --status in_progress

# Discover cross-repo dependency
bd create "Update client SDK" -t task -p 1

# Link with discovered-from (auto-inherits source_repo)
bd dep add bd-f14c bd-a1b2 --type discovered-from
```

### Fork vs Team Workflows

**OSS Contributor (Fork Workflow):**
```bash
# Issues stay in your fork
bd init --contributor

# Your issues never push to upstream
# Work tracking remains private
```

**Team Member (Branch Workflow):**
```bash
# Issues pushed to main repository
bd init --team

# Requires git merge driver setup
git config merge.beads.driver "bd merge %A %O %A %B"
```

## Protected Branch Workflows

For repositories with protected main branches:

```bash
# Initialize with separate metadata branch
bd init --branch beads-metadata

# Creates git worktrees:
# - .git/beads-worktrees/main (read-only)
# - .git/beads-worktrees/beads-metadata (write)

# All issue updates commit to beads-metadata
bd create "Task" -p 1
git log beads-metadata  # Shows issue updates
```

**Sync workflow:**
1. Agent updates issues (commits to beads-metadata)
2. CI/CD job merges beads-metadata → main (automated)
3. Other machines pull main, auto-import updated JSONL

## Agent Mail (Real-Time Sync)

For sub-100ms synchronization between agents:

### Setup

```bash
# 1. Deploy Agent Mail server
cd examples/agent-mail-server
go build
./agent-mail-server --port 8080

# 2. Configure clients
bd config set agent_mail.enabled true
bd config set agent_mail.url wss://your-server.com:8080
bd config set agent_mail.auth_token "your-secret-token"

# 3. Test connection
bd config get agent_mail.enabled
```

### Usage Pattern

```python
#!/usr/bin/env python3
"""Agent Mail client example for real-time coordination."""

import asyncio
import websockets
import json
import subprocess

async def listen_for_urgent_issues():
    """Listen for P0 issues and auto-claim."""
    uri = "wss://agent-mail.example.com:8080"
    
    async with websockets.connect(uri) as websocket:
        # Subscribe to issue.created events
        await websocket.send(json.dumps({
            "type": "subscribe",
            "events": ["issue.created", "issue.updated"]
        }))
        
        async for message in websocket:
            event = json.loads(message)
            
            if event["type"] == "issue.created" and event["issue"]["priority"] == 0:
                issue_id = event["issue"]["id"]
                
                # Check if unclaimed
                result = subprocess.run(
                    f"bd show {issue_id} --json",
                    shell=True,
                    capture_output=True,
                    text=True
                )
                issue = json.loads(result.stdout)
                
                if not issue.get("assignee"):
                    # Auto-claim P0 issue
                    subprocess.run(
                        f"bd update {issue_id} --assignee $(whoami)",
                        shell=True
                    )
                    print(f"Claimed urgent issue: {issue_id}")
                    
                    # Notify other agents
                    await websocket.send(json.dumps({
                        "type": "claim",
                        "issue_id": issue_id
                    }))

if __name__ == "__main__":
    asyncio.run(listen_for_urgent_issues())
```

### Performance Characteristics

- **Git sync**: 2-5 seconds (push + pull + import)
- **Agent Mail**: <100ms (WebSocket broadcast)
- **Traffic reduction**: 98.5% fewer git operations

## Memory Management (Compaction)

As issue databases grow (>50MB JSONL), use semantic compaction:

```bash
# Auto-compact old completed issues
bd compact --auto --all

# Preview compaction plan
bd compact --dry-run --older-than 90d

# Manual compaction with criteria
bd compact --status closed --older-than 30d
```

**Compaction behavior:**
- Closed issues older than threshold → Summarized
- Original JSONL preserved in `.beads/archive/`
- Dependency references updated automatically
- Irreversible operation (backup first!)

## Batch Operations

For bulk issue management:

```bash
# Bulk create from JSONL file
bd import --file issues-batch.jsonl

# Bulk update with jq filter
bd list --status open --priority 4 --json | \
  jq -r '.[] | .id' | \
  xargs -I {} bd update {} --status closed --reason "Stale task cleanup"

# Bulk label application
bd list --created-before 2024-01-01 --json | \
  jq -r '.[] | .id' | \
  xargs -I {} bd update {} --label legacy
```

## Dependency Patterns

### Epic Breakdown Pattern

```bash
# Create epic with hierarchical children
bd create "Q4 Auth Improvements" -t epic -p 1
# Returns: bd-a1b2

# Children auto-inherit hierarchical IDs
bd create "OAuth integration" -p 1 --parent bd-a1b2
# Returns: bd-a1b2.1

bd create "JWT migration" -p 1 --parent bd-a1b2
# Returns: bd-a1b2.2

# Add sequential blocking
bd dep add bd-a1b2.2 bd-a1b2.1 --type blocks

# Visualize
bd dep tree bd-a1b2
```

### Critical Path Analysis

```bash
# Find longest blocking chain
bd dep tree bd-a1b2 --json | \
  jq '[.. | .dependencies[]? | select(.type == "blocks")] | length'

# Identify bottleneck issues (most dependents)
bd list --json | \
  jq 'map({id, title, dependent_count: (.dependencies | length)}) | sort_by(-.dependent_count)'
```

## Migration from v0.19 to v0.20.1+

### Hash ID Migration

```bash
# Preview migration (no changes)
bd migrate --dry-run

# Inspect migration plan (for AI supervision)
bd migrate --inspect --json

# Execute migration
bd migrate

# Verify success
bd info --schema --json | jq '.schema_version'  # Should be 9+
```

### Breaking Changes

1. **ID Format**: Sequential (`bd-123`) → Hash-based (`bd-a1b2`)
2. **Child IDs**: Parent hash changes → Children auto-update
3. **Schema Version**: v8 → v9 (issue_counters table removed)

### Post-Migration Workflow

```bash
# Update markdown references
find . -name "*.md" -exec sed -i 's/bd-\([0-9]\+\)/bd-[hash]/g' {} +

# Update code comments
find . -name "*.py" -exec sed -i 's/bd-\([0-9]\+\)/bd-[hash]/g' {} +

# Test multi-branch workflow
git checkout -b test-branch-1
bd create "Test A" -p 1  # Returns bd-a1b2

git checkout main
git checkout -b test-branch-2
bd create "Test B" -p 1  # Returns bd-f14c (no collision!)

git checkout main
git merge test-branch-1
git merge test-branch-2  # No conflicts!
```

## Troubleshooting Advanced Issues

### Daemon Version Mismatch

```bash
# Symptoms: "Protocol mismatch" errors after upgrade
# Fix: Kill old daemon, let new CLI restart it
bd daemons killall
bd info  # Auto-starts new daemon
```

### JSONL Merge Conflicts

```bash
# Symptoms: Git conflicts in .beads/issues.jsonl
# Cause: Git merge driver not configured
# Fix: Configure merge driver
git config merge.beads.driver "bd merge %A %O %A %B"

# Add to .gitattributes
echo ".beads/issues.jsonl merge=beads" >> .gitattributes
```

### Orphaned Children After Import

```bash
# Symptoms: Child issues with missing parents
# Cause: Parent deleted but children remain
# Fix: Resurrect parent tombstones
bd import --orphan-handling=resurrect

# Verify
bd list --json | jq '.[] | select(.id | contains("."))'
```

### Circular Dependency Deadlock

```bash
# Detect cycles
bd dep cycles

# Output: Cycle detected: bd-a1b2 → bd-f14c → bd-a1b2

# Break cycle by removing one edge
bd dep remove bd-f14c bd-a1b2

# Verify
bd dep cycles  # Should report "No cycles detected"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Beads Sync
on: [push, pull_request]

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install bd
        run: |
          curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
          export PATH="$PATH:$HOME/.local/bin"
      
      - name: Sync issue tracker
        run: bd sync --quiet
      
      - name: Check for cycles
        run: bd dep cycles
      
      - name: Run tests
        run: make test
      
      - name: Auto-commit updated issues
        run: |
          git config user.name "GitHub Actions"
          git config user.email "actions@github.com"
          git add .beads/issues.jsonl
          git diff --staged --quiet || git commit -m "chore: sync issue tracker [skip ci]"
```

### GitLab CI Example

```yaml
beads-sync:
  stage: build
  script:
    - curl -fsSL https://raw.githubusercontent.com/steveyegge/beads/main/scripts/install.sh | bash
    - export PATH="$PATH:$HOME/.local/bin"
    - bd sync --quiet
    - bd dep cycles
  artifacts:
    paths:
      - .beads/issues.jsonl
```

## Custom Extensions

### Adding Custom Fields

```sql
-- Connect to .beads/beads.db
-- Add custom metrics table
CREATE TABLE issue_metrics (
  issue_id TEXT PRIMARY KEY,
  lines_changed INTEGER,
  test_coverage REAL,
  review_time_minutes INTEGER,
  FOREIGN KEY (issue_id) REFERENCES issues(id)
);

-- Query with custom data
SELECT 
  i.id, 
  i.title, 
  i.status,
  m.lines_changed,
  m.test_coverage
FROM issues i
LEFT JOIN issue_metrics m ON i.id = m.issue_id
WHERE i.priority = 0;
```

### Custom Sort Policies

```python
#!/usr/bin/env python3
"""Custom sort policy: Sort by technical debt score."""

import json
import subprocess

def get_ready_issues():
    """Fetch ready issues."""
    result = subprocess.run(
        "bd ready --json",
        shell=True,
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

def calculate_debt_score(issue):
    """Calculate technical debt score (higher = more important)."""
    score = 0
    
    # Priority weight
    score += (4 - issue['priority']) * 10
    
    # Age weight (older = higher debt)
    # Parse created_at and calculate days old
    # score += days_old * 0.5
    
    # Label-based adjustments
    if 'tech-debt' in issue.get('labels', []):
        score += 20
    if 'security' in issue.get('labels', []):
        score += 30
    
    return score

def main():
    ready_issues = get_ready_issues()
    
    # Sort by custom debt score
    sorted_issues = sorted(
        ready_issues,
        key=calculate_debt_score,
        reverse=True
    )
    
    # Display top 5
    for issue in sorted_issues[:5]:
        score = calculate_debt_score(issue)
        print(f"[{issue['id']}] {issue['title']} (Debt Score: {score})")

if __name__ == "__main__":
    main()
```

## Best Practices Summary

1. **Use hash IDs** (v0.20.1+) for multi-worker workflows
2. **Configure merge driver** for team collaboration
3. **Run `bd dep cycles`** periodically to detect deadlocks
4. **Use labels** for flexible filtering and reporting
5. **Link discovered work** with `discovered-from` dependencies
6. **Sync frequently** via git hooks or CI/CD
7. **Compact old issues** when JSONL exceeds 50MB
8. **Use Agent Mail** for real-time coordination (<100ms)
9. **Check blockers** before starting work
10. **Close with reasons** for audit trail
