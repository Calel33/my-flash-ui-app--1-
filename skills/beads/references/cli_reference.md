# Beads CLI Reference

Quick reference for all Beads commands and JSON output formats.

## Core Commands

### Issue Management

#### `bd create` - Create new issue
```bash
bd create "Title" [options]
```

**Options:**
- `-t, --type` - Issue type: task (default), bug, feature, epic, chore
- `-p, --priority` - Priority: 0 (critical) to 4 (trivial), default 2
- `-d, --description` - Detailed description
- `--assignee` - Assign to user
- `--label` - Add labels (comma-separated)
- `--parent` - Parent issue ID (for hierarchical issues)
- `--source-repo` - Source repository annotation
- `--json` - Output JSON

**JSON Output:**
```json
{
  "id": "bd-a1b2",
  "title": "Fix auth bug",
  "type": "bug",
  "priority": 1,
  "status": "open",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### `bd list` - List issues
```bash
bd list [filters] [options]
```

**Filters:**
- `--status` - Filter by status: open, in_progress, completed, blocked, closed
- `--priority` - Filter by exact priority (0-4)
- `--priority-min` - Minimum priority (0-4)
- `--priority-max` - Maximum priority (0-4)
- `--type` - Filter by type: bug, feature, task, epic, chore
- `--assignee` - Filter by assignee
- `--label` - Filter by labels (AND logic, comma-separated)
- `--label-any` - Filter by labels (OR logic, comma-separated)
- `--created-after` - Filter by creation date (ISO 8601)
- `--created-before` - Filter by creation date (ISO 8601)
- `--source-repo` - Filter by source repository

**Options:**
- `--json` - Output JSON array
- `--limit` - Limit number of results

**JSON Output:**
```json
[
  {
    "id": "bd-a1b2",
    "title": "Fix auth bug",
    "type": "bug",
    "priority": 1,
    "status": "open",
    "assignee": "alice",
    "labels": ["backend", "urgent"],
    "dependencies": [...],
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### `bd show` - Show issue details
```bash
bd show <issue-id> [--json]
```

**JSON Output:**
```json
{
  "id": "bd-a1b2",
  "title": "Fix auth bug",
  "description": "SQL injection vulnerability in login endpoint",
  "type": "bug",
  "priority": 0,
  "status": "in_progress",
  "assignee": "alice",
  "labels": ["security", "backend"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T14:20:00Z",
  "source_repo": "github.com/org/api-service",
  "dependencies": [
    {
      "type": "blocks",
      "target_id": "bd-f14c",
      "status": "closed",
      "title": "Implement prepared statements"
    }
  ]
}
```

#### `bd update` - Update issue
```bash
bd update <issue-id> [options]
```

**Options:**
- `--status` - New status: open, in_progress, completed, blocked, closed
- `--priority` - New priority (0-4)
- `--assignee` - Assign to user
- `--add-label` - Add label
- `--remove-label` - Remove label
- `--title` - Update title
- `--description` - Update description
- `--json` - Output JSON

#### `bd close` - Close issue
```bash
bd close <issue-id> --reason "Completion reason" [--json]
```

#### `bd delete` - Delete issue
```bash
bd delete <issue-id> --force
```

### Dependency Management

#### `bd dep add` - Add dependency
```bash
bd dep add <source-id> <target-id> --type <type>
```

**Dependency Types:**
- `blocks` - source blocks target (target depends on source)
- `related` - Soft relationship, non-blocking
- `parent-child` - Hierarchical relationship
- `discovered-from` - Issue discovered during work on another

**Example:**
```bash
# bd-a1b2 blocks bd-f14c (bd-f14c depends on bd-a1b2)
bd dep add bd-a1b2 bd-f14c --type blocks
```

#### `bd dep remove` - Remove dependency
```bash
bd dep remove <source-id> <target-id>
```

#### `bd dep tree` - Visualize dependency tree
```bash
bd dep tree <issue-id> [--json]
```

**JSON Output:**
```json
{
  "root": "bd-a1b2",
  "tree": {
    "id": "bd-a1b2",
    "title": "Q4 Auth Improvements",
    "status": "open",
    "children": [
      {
        "id": "bd-a1b2.1",
        "title": "OAuth integration",
        "status": "in_progress",
        "dependency_type": "parent-child"
      },
      {
        "id": "bd-a1b2.2",
        "title": "JWT migration",
        "status": "blocked",
        "dependency_type": "blocks"
      }
    ]
  }
}
```

#### `bd dep cycles` - Detect circular dependencies
```bash
bd dep cycles [--json]
```

### Query Commands

#### `bd ready` - Find ready work
```bash
bd ready [filters] [--sort=<policy>] [--json]
```

**Sort Policies:**
- `hybrid` (default) - Recent issues by priority, old issues by age
- `priority` - Strict P0 → P1 → P2 ordering
- `oldest` - FIFO, ignore priority

**Filters:** Same as `bd list`

**JSON Output:**
```json
[
  {
    "id": "bd-a1b2",
    "title": "Fix auth bug",
    "priority": 1,
    "status": "open",
    "dependencies": []
  }
]
```

#### `bd blocked` - Find blocked issues
```bash
bd blocked [--json]
```

**JSON Output:**
```json
[
  {
    "id": "bd-f14c",
    "title": "Deploy to production",
    "blocked_by": [
      {
        "id": "bd-a1b2",
        "title": "Fix auth bug",
        "status": "in_progress"
      }
    ]
  }
]
```

### Sync Commands

#### `bd sync` - Force sync to JSONL
```bash
bd sync [--quiet]
```

Forces immediate SQLite → JSONL export (bypasses 5s debounce).

#### `bd import` - Import from JSONL
```bash
bd import [options]
```

**Options:**
- `-i, --file` - Import from specific JSONL file
- `--orphan-handling` - Handle orphaned children: skip, resurrect, error (default)
- `--quiet` - Suppress output

#### `bd export` - Export to JSONL
```bash
bd export [--file output.jsonl]
```

### Database Management

#### `bd init` - Initialize Beads
```bash
bd init [options]
```

**Options:**
- `--branch` - Use separate metadata branch (for protected branches)
- `--contributor` - Fork workflow (issues stay in fork)
- `--team` - Team workflow (issues pushed to main repo)

#### `bd info` - Database information
```bash
bd info [--schema] [--json]
```

**JSON Output:**
```json
{
  "database_path": "/path/to/.beads/beads.db",
  "schema_version": 9,
  "id_format": "hash",
  "issue_count": 42,
  "daemon_running": true,
  "daemon_version": "0.20.1"
}
```

#### `bd migrate` - Migrate database schema
```bash
bd migrate [options]
```

**Options:**
- `--dry-run` - Preview migration without changes
- `--inspect` - Show detailed migration plan (for AI supervision)
- `--json` - Output JSON

#### `bd compact` - Compact old issues
```bash
bd compact [options]
```

**Options:**
- `--auto` - Auto-select old completed issues
- `--all` - Compact all matching issues
- `--dry-run` - Preview compaction
- `--older-than` - Age threshold (e.g., 90d, 6m, 1y)
- `--status` - Filter by status

### Daemon Management

#### `bd daemons` - Manage daemons
```bash
bd daemons <command> [args]
```

**Commands:**
- `list` - List all running daemons
- `start <path>` - Start daemon for workspace
- `stop <path>` - Stop daemon for workspace
- `restart <path>` - Restart daemon
- `killall` - Kill all daemons
- `logs <path>` - Show daemon logs

### Configuration

#### `bd config` - Manage configuration
```bash
bd config <command> <key> [value]
```

**Commands:**
- `get <key>` - Get configuration value
- `set <key> <value>` - Set configuration value
- `unset <key>` - Remove configuration value
- `list` - List all configuration

**Common Keys:**
- `agent_mail.enabled` - Enable Agent Mail (true/false)
- `agent_mail.url` - Agent Mail server URL
- `agent_mail.auth_token` - Authentication token
- `sort.default` - Default sort policy (hybrid/priority/oldest)

### Utility Commands

#### `bd doctor` - Health check
```bash
bd doctor
```

Checks for:
- Circular dependencies
- Orphaned issues
- Daemon status
- Database integrity
- Git merge driver configuration

#### `bd onboard` - Agent onboarding
```bash
bd onboard
```

Interactive onboarding for AI agents:
1. Adds Beads workflow to AGENTS.md
2. Updates CLAUDE.md with note
3. Removes bootstrap instruction
4. Runs quickstart tutorial

#### `bd quickstart` - Interactive tutorial
```bash
bd quickstart
```

Interactive tutorial covering:
- Basic CRUD operations
- Dependency management
- Ready work discovery
- Git integration

## JSON Parsing Examples

### Using jq for Filtering

```bash
# Get first ready issue's ID
bd ready --json | jq -r '.[0].id'

# List all P0 bugs
bd list --type bug --priority 0 --json | jq '.[] | {id, title}'

# Find issues blocked by more than 2 dependencies
bd blocked --json | jq '.[] | select((.blocked_by | length) > 2)'

# Extract all issue IDs
bd list --json | jq -r '.[].id'

# Group issues by status
bd list --json | jq 'group_by(.status) | map({status: .[0].status, count: length})'
```

### Using Python for Processing

```python
import json
import subprocess

def get_issues(filters=""):
    """Fetch issues with optional filters."""
    result = subprocess.run(
        f"bd list {filters} --json",
        shell=True,
        capture_output=True,
        text=True
    )
    return json.loads(result.stdout)

# Get all open P1 bugs
bugs = get_issues("--type bug --priority 1 --status open")

for bug in bugs:
    print(f"{bug['id']}: {bug['title']}")
```

## Exit Codes

- `0` - Success
- `1` - General error
- `2` - Invalid arguments
- `3` - Database error
- `4` - Git error
- `5` - Daemon error
- `6` - Validation error

## Environment Variables

- `BD_DATABASE_PATH` - Override database location
- `BD_NO_DAEMON` - Disable daemon (for CI/CD)
- `BD_LOG_LEVEL` - Log level: debug, info, warn, error
- `BD_JSON` - Force JSON output (equivalent to --json)
