#!/usr/bin/env python3
"""
Dependency Analyzer - Analyze and visualize Beads dependency graphs

This script helps agents understand complex dependency relationships:
- Detect circular dependencies
- Find orphaned issues
- Visualize dependency trees
- Identify critical path for epics

Usage:
    # Check for circular dependencies
    python dependency_analyzer.py cycles
    
    # Visualize dependency tree for an issue
    python dependency_analyzer.py tree <issue-id>
    
    # Find all blockers in the project
    python dependency_analyzer.py blockers
    
    # Identify orphaned issues
    python dependency_analyzer.py orphans
"""

import json
import subprocess
import sys
from collections import defaultdict
from typing import Dict, List, Set, Optional, Tuple


def run_bd(cmd: str) -> Optional[Dict | List]:
    """Execute bd command and return JSON output."""
    try:
        result = subprocess.run(
            f"bd {cmd} --json",
            shell=True,
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode != 0:
            print(f"Error: {result.stderr}", file=sys.stderr)
            return None
        
        return json.loads(result.stdout) if result.stdout.strip() else None
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return None


def get_all_issues() -> List[Dict]:
    """Fetch all issues from the database."""
    issues = run_bd("list")
    return issues if issues else []


def build_dependency_graph() -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """
    Build dependency graph from all issues.
    
    Returns:
        (forward_graph, reverse_graph)
        forward_graph: issue_id -> [issues that depend on it]
        reverse_graph: issue_id -> [issues it depends on]
    """
    issues = get_all_issues()
    forward_graph = defaultdict(list)  # Dependencies pointing to this issue
    reverse_graph = defaultdict(list)  # Dependencies this issue points to
    
    for issue in issues:
        issue_id = issue['id']
        for dep in issue.get('dependencies', []):
            if dep['type'] == 'blocks':
                target_id = dep['target_id']
                # issue_id blocks target_id (target depends on issue)
                forward_graph[issue_id].append(target_id)
                reverse_graph[target_id].append(issue_id)
    
    return dict(forward_graph), dict(reverse_graph)


def detect_cycles() -> List[List[str]]:
    """
    Detect circular dependencies using DFS.
    
    Returns:
        List of cycles, where each cycle is a list of issue IDs
    """
    forward_graph, _ = build_dependency_graph()
    
    cycles = []
    visited = set()
    rec_stack = set()
    path = []
    
    def dfs(node: str) -> bool:
        """DFS with cycle detection."""
        visited.add(node)
        rec_stack.add(node)
        path.append(node)
        
        for neighbor in forward_graph.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
            elif neighbor in rec_stack:
                # Found cycle
                cycle_start = path.index(neighbor)
                cycles.append(path[cycle_start:] + [neighbor])
                return True
        
        path.pop()
        rec_stack.remove(node)
        return False
    
    # Check all nodes
    for node in forward_graph:
        if node not in visited:
            dfs(node)
    
    return cycles


def find_blockers() -> List[Dict]:
    """Find all issues that are currently blocking other issues."""
    issues = get_all_issues()
    blockers = []
    
    for issue in issues:
        if issue['status'] in ['open', 'in_progress']:
            deps = issue.get('dependencies', [])
            blocking_deps = [
                d for d in deps
                if d['type'] == 'blocks' and d['status'] != 'closed'
            ]
            
            if blocking_deps:
                blockers.append({
                    'id': issue['id'],
                    'title': issue['title'],
                    'blocked_by': [d['target_id'] for d in blocking_deps],
                    'blocked_count': len(blocking_deps)
                })
    
    return sorted(blockers, key=lambda x: x['blocked_count'], reverse=True)


def find_orphans() -> List[Dict]:
    """Find issues with hierarchical parents that don't exist."""
    issues = get_all_issues()
    issue_ids = {issue['id'] for issue in issues}
    orphans = []
    
    for issue in issues:
        issue_id = issue['id']
        # Check if this is a child issue (has dot notation)
        if '.' in issue_id:
            parent_id = issue_id.rsplit('.', 1)[0]
            if parent_id not in issue_ids:
                orphans.append({
                    'id': issue_id,
                    'title': issue['title'],
                    'missing_parent': parent_id
                })
    
    return orphans


def visualize_tree(root_id: str, max_depth: int = 5) -> str:
    """
    Visualize dependency tree for an issue.
    
    Args:
        root_id: Root issue ID
        max_depth: Maximum depth to traverse
        
    Returns:
        ASCII tree representation
    """
    issue = run_bd(f"show {root_id}")
    if not issue:
        return f"Issue {root_id} not found"
    
    lines = []
    visited = set()
    
    def traverse(issue_id: str, depth: int = 0, prefix: str = "", is_last: bool = True):
        """Recursively traverse and build tree."""
        if depth > max_depth or issue_id in visited:
            return
        
        visited.add(issue_id)
        
        # Get issue details
        issue_data = run_bd(f"show {issue_id}")
        if not issue_data:
            return
        
        # Format current node
        connector = "└─ " if is_last else "├─ "
        icon = "🔴" if issue_data['status'] == 'blocked' else "🟢" if issue_data['status'] == 'open' else "✅"
        line = f"{prefix}{connector}{icon} {issue_id}: {issue_data['title']} [{issue_data['status']}]"
        lines.append(line)
        
        # Process dependencies
        deps = issue_data.get('dependencies', [])
        blocking_deps = [d for d in deps if d['type'] == 'blocks']
        
        for i, dep in enumerate(blocking_deps):
            is_last_dep = (i == len(blocking_deps) - 1)
            extension = "    " if is_last else "│   "
            traverse(dep['target_id'], depth + 1, prefix + extension, is_last_dep)
    
    traverse(root_id)
    return "\n".join(lines)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "cycles":
        print("Checking for circular dependencies...\n")
        cycles = detect_cycles()
        
        if not cycles:
            print("✅ No circular dependencies detected")
        else:
            print(f"❌ Found {len(cycles)} circular dependenc{'y' if len(cycles) == 1 else 'ies'}:\n")
            for i, cycle in enumerate(cycles, 1):
                print(f"Cycle {i}: {' → '.join(cycle)}")
        
    elif command == "tree":
        if len(sys.argv) < 3:
            print("Usage: dependency_analyzer.py tree <issue-id>")
            sys.exit(1)
        
        issue_id = sys.argv[2]
        print(f"Dependency tree for {issue_id}:\n")
        print(visualize_tree(issue_id))
    
    elif command == "blockers":
        print("Finding blocked issues...\n")
        blockers = find_blockers()
        
        if not blockers:
            print("✅ No blocked issues")
        else:
            print(f"Found {len(blockers)} blocked issue(s):\n")
            for item in blockers:
                print(f"{item['id']}: {item['title']}")
                print(f"  Blocked by {item['blocked_count']} issue(s): {', '.join(item['blocked_by'])}\n")
    
    elif command == "orphans":
        print("Finding orphaned issues...\n")
        orphans = find_orphans()
        
        if not orphans:
            print("✅ No orphaned issues")
        else:
            print(f"Found {len(orphans)} orphaned issue(s):\n")
            for orphan in orphans:
                print(f"{orphan['id']}: {orphan['title']}")
                print(f"  Missing parent: {orphan['missing_parent']}\n")
    
    else:
        print(f"Unknown command: {command}")
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
