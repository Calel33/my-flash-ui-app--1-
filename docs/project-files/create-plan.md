 Planning and Design
Based on your research, create a detailed plan that includes:

3.1 Task Breakdown
Create a prioritized list of implementation tasks:

Each task should be specific and actionable
Tasks should be sized appropriately
Include dependencies between tasks
Order tasks logically for implementation flow
3.2 Technical Architecture
Define the technical approach:

Component structure and organization
Data flow and state management
API design (if applicable)
Database schema changes (if needed)
Integration points with existing code
3.3 Implementation References
Document key resources for implementation:

Existing code files to reference or modify
Documentation links for technologies used
Code examples from research
Patterns to follow from the codebase
Libraries or dependencies to add
Step 4: Create the Plan Document
Write a comprehensive plan to PRPs/[feature-name].md with roughly this structure (n represents that this could be any number of those things):

# Implementation Plan: [Feature Name]

## Overview
[Brief description of what will be implemented]

## Requirements Summary
- [Key requirement 1]
- [Key requirement 2]
- [Key requirement n]

## Research Findings
### Best Practices
- [Finding 1]
- [Finding n]

### Reference Implementations
- [Example 1 with link/location]
- [Example n with link/location]

### Technology Decisions
- [Technology choice 1 and rationale]
- [Technology choice n and rationale]

## Implementation Tasks

### Phase 1: Foundation
1. **Task Name**
   - Description: [What needs to be done]
   - Files to modify/create: [List files]
   - Dependencies: [Any prerequisites]
   - Estimated effort: [time estimate]

2. **Task Name**
   - Description: [What needs to be done]
   - Files to modify/create: [List files]
   - Dependencies: [Any prerequisites]
   - Estimated effort: [time estimate]

### Phase 2: Core Implementation
[Continue with numbered tasks...]

### Phase 3: Integration & Testing
[Continue with numbered tasks...]

## Codebase Integration Points
### Files to Modify
- `path/to/file1.js` - [What changes needed]
- `path/to/filen.py` - [What changes needed]

### New Files to Create
- `path/to/newfile1.js` - [Purpose]
- `path/to/newfilen.py` - [Purpose]

### Existing Patterns to Follow
- [Pattern 1 from codebase]
- [Pattern n from codebase]

## Technical Design

### Architecture Diagram (if applicable)
[ASCII diagram or description]


### Data Flow
[Description of how data flows through the feature]

### API Endpoints (if applicable)
- `POST /api/endpoint` - [Purpose]
- `GET /api/endpoint/:id` - [Purpose]

## Dependencies and Libraries
- [Library 1] - [Purpose]
- [Library n] - [Purpose]

## Testing Strategy
- Unit tests for [components]
- Integration tests for [workflows]
- Edge cases to cover: [list]

## Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion n]

## Notes and Considerations
- [Any important notes]
- [Potential challenges]
- [Future enhancements]

---
*This plan is ready for execution with `/execute-plan`*
Step 5: Validation
Before finalizing the plan:

Ensure all requirements are addressed
Verify tasks are properly sequenced
Check that integration points are identified
Confirm research supports the approach
Make sure the plan is actionable and clear
Important Guidelines
Be thorough in research: The quality of the plan depends on understanding best practices
Keep it actionable: Every task should be clear and implementable
Reference everything: Include links, file paths, and examples
Consider the existing codebase: Follow established patterns and conventions
Think about testing: Include testing tasks in the plan
Size tasks appropriately: Not too large, not too granular
Output
Save the plan to the PRPs directory and inform the user: "Implementation plan created at: PRPs/[feature-name].md