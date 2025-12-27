#!/usr/bin/env python3
"""
Agent Workflow Script - Automated Beads workflow for AI agents

This script implements the recommended agent session protocol:
1. Find ready work
2. Start work (update status to in_progress)
3. Complete work (close issue with reason)
4. Handle discovered issues during work

Usage:
    # Find and start next ready work
    python agent_workflow.py start
    
    # Complete current work
    python agent_workflow.py complete <issue-id> --reason "Implementation complete"
    
    # File discovered issue during work
    python agent_workflow.py discover <parent-id> "Bug description" --priority 0
    
    # Full session workflow (interactive)
    python agent_workflow.py session
"""

import json
import subprocess
import sys
from typing import Dict, List, Optional


def run_bd_command(cmd: str, capture_json: bool = True) -> Optional[Dict | List]:
    """
    Execute bd command and return parsed JSON output.
    
    Args:
        cmd: bd command without 'bd' prefix (e.g., "ready --json")
        capture_json: If True, parse JSON output
        
    Returns:
        Parsed JSON data or None if error
    """
    full_cmd = f"bd {cmd}"
    if capture_json and "--json" not in cmd:
        full_cmd += " --json"
    
    try:
        result = subprocess.run(
            full_cmd,
            shell=True,
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode != 0:
            print(f"Error running command: {full_cmd}", file=sys.stderr)
            print(f"Error output: {result.stderr}", file=sys.stderr)
            return None
        
        if capture_json:
            return json.loads(result.stdout) if result.stdout.strip() else None
        return result.stdout
    
    except json.JSONDecodeError as e:
        print(f"Failed to parse JSON: {e}", file=sys.stderr)
        print(f"Output was: {result.stdout}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Unexpected error: {e}", file=sys.stderr)
        return None


def find_ready_work(priority_min: Optional[int] = None) -> Optional[Dict]:
    """Find highest-priority ready work."""
    cmd = "ready"
    if priority_min is not None:
        cmd += f" --priority-min {priority_min}"
    
    ready_issues = run_bd_command(cmd)
    if not ready_issues:
        print("No ready work available.")
        return None
    
    return ready_issues[0] if isinstance(ready_issues, list) else ready_issues


def start_work(issue_id: str) -> bool:
    """Start work on an issue by updating status to in_progress."""
    result = run_bd_command(f"update {issue_id} --status in_progress")
    if result:
        print(f"Started work on {issue_id}: {result.get('title', 'Unknown')}")
        return True
    return False


def complete_work(issue_id: str, reason: str) -> bool:
    """Close an issue with completion reason."""
    result = run_bd_command(f"close {issue_id} --reason \"{reason}\"")
    if result:
        print(f"Completed {issue_id}: {reason}")
        return True
    return False


def file_discovered_issue(parent_id: str, title: str, priority: int = 2, issue_type: str = "bug") -> Optional[str]:
    """
    File a discovered issue and link it to parent.
    
    Returns:
        New issue ID if successful, None otherwise
    """
    # Create the issue
    result = run_bd_command(f"create \"{title}\" -t {issue_type} -p {priority}")
    if not result:
        return None
    
    new_issue_id = result.get('id')
    print(f"Filed {issue_type} {new_issue_id}: {title}")
    
    # Link to parent with discovered-from relationship
    link_result = run_bd_command(f"dep add {new_issue_id} {parent_id} --type discovered-from", capture_json=False)
    if link_result:
        print(f"Linked {new_issue_id} to parent {parent_id}")
    
    return new_issue_id


def check_blockers(issue_id: str) -> List[Dict]:
    """Check if an issue has blocking dependencies."""
    issue = run_bd_command(f"show {issue_id}")
    if not issue:
        return []
    
    blockers = [
        dep for dep in issue.get('dependencies', [])
        if dep.get('type') == 'blocks' and dep.get('status') != 'closed'
    ]
    
    return blockers


def interactive_session():
    """Run interactive agent session workflow."""
    print("=== Beads Agent Session ===\n")
    
    # Step 1: Find ready work
    print("1. Finding ready work...")
    issue = find_ready_work()
    if not issue:
        print("No work available. Session complete.")
        return
    
    issue_id = issue['id']
    title = issue['title']
    priority = issue['priority']
    
    print(f"\nFound: [{issue_id}] {title} (P{priority})")
    
    # Step 2: Check blockers
    blockers = check_blockers(issue_id)
    if blockers:
        print(f"\nWarning: Issue has {len(blockers)} blocker(s):")
        for blocker in blockers:
            print(f"  - {blocker['target_id']}: {blocker.get('title', 'Unknown')}")
        
        proceed = input("\nProceed anyway? (y/n): ")
        if proceed.lower() != 'y':
            print("Session aborted.")
            return
    
    # Step 3: Start work
    print("\n2. Starting work...")
    if not start_work(issue_id):
        print("Failed to start work. Session aborted.")
        return
    
    # Step 4: Simulate work (in real usage, agent does actual work here)
    print("\n3. Work in progress...")
    print("   (Agent would implement solution here)")
    
    # Step 5: Handle discovered issues
    discover = input("\nDiscover any issues during work? (y/n): ")
    if discover.lower() == 'y':
        bug_title = input("Issue description: ")
        bug_priority = int(input("Priority (0-4): "))
        file_discovered_issue(issue_id, bug_title, bug_priority)
    
    # Step 6: Complete work
    reason = input("\nCompletion reason: ")
    complete_work(issue_id, reason)
    
    # Step 7: Sync reminder
    print("\n4. Session complete!")
    print("   Remember to sync: git add .beads/issues.jsonl && git commit && git push")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "start":
        issue = find_ready_work()
        if issue:
            start_work(issue['id'])
    
    elif command == "complete":
        if len(sys.argv) < 3:
            print("Usage: agent_workflow.py complete <issue-id> --reason <reason>")
            sys.exit(1)
        
        issue_id = sys.argv[2]
        reason = " ".join(sys.argv[4:]) if len(sys.argv) > 4 and sys.argv[3] == "--reason" else "Completed"
        complete_work(issue_id, reason)
    
    elif command == "discover":
        if len(sys.argv) < 4:
            print("Usage: agent_workflow.py discover <parent-id> <description> [--priority N]")
            sys.exit(1)
        
        parent_id = sys.argv[2]
        description = sys.argv[3]
        priority = int(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[4] == "--priority" else 2
        file_discovered_issue(parent_id, description, priority)
    
    elif command == "session":
        interactive_session()
    
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
