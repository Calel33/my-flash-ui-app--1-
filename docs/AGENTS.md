# 🤖 Documentation Agents Guide

This file provides instructions for AI agents working with the documentation system in this project.

## 📋 Project Overview

This project follows the Universal Document Rules v2.0 for maintaining professional documentation and seamless session management. The documentation structure is designed to provide comprehensive coverage of all aspects of the project while maintaining organization and accessibility.

## 🏗️ Documentation Structure

```
docs/
├── README.md                    # Main documentation overview
├── SESSION_LOG.md              # Master log of all sessions
├── AGENTS.md                   # This file - agent instructions
├── core/                       # Core project documentation
│   ├── PRODUCT_BRIEF.md        # Product overview and requirements
│   ├── ARCHITECTURE.md         # System architecture and design
│   ├── PROJECT_PROGRESS.md     # Current project status
│   ├── API_REFERENCE.md        # API documentation
│   ├── DEVELOPMENT_GUIDE.md    # Development setup and guidelines
│   ├── USER_GUIDE.md           # End-user documentation
│   └── BUG_LOG.md              # Bug tracking
├── guides/                     # Detailed guides for specific topics
├── sessions/                   # Session documentation
│   ├── general/                # General work sessions
│   ├── pauses/                 # Session pause documentation
│   ├── handoffs/               # Agent handoff documentation
│   ├── endings/                # Session summaries
│   └── learnings/              # Technical insights and lessons
└── tasks/                      # Task-specific documentation
    └── [task-name]/
        ├── README.md           # Task overview
        ├── sessions/           # Task-specific sessions
        ├── validation/         # Validation reports
        └── learnings/          # Task-specific learnings
```

## 📝 Documentation Standards

### Universal Document Rules v2.0

This project strictly follows the Universal Document Rules v2.0. Key requirements:

1. **ALWAYS** check/create documentation structure before starting work
2. **MANDATORY** session documentation (start, pause, resume, end)
3. **Preserve** project context across sessions
4. **Document** insights & lessons learned
5. **NEVER** start work without checking/creating docs structure
6. **NEVER** skip session documentation
7. **NEVER** pause work without documenting state
8. **NEVER** delete or overwrite session documents

### File Naming Conventions

- Core docs: `UPPERCASE_WITH_UNDERSCORES.md`
- Session docs: `SESSION_YYYY-MM-DD_[DESCRIPTION].md`
- Pause docs: `PAUSE_YYYY-MM-DD_[DESCRIPTION].md`
- Validation reports: `TASK_COMPLETION_VALIDATION_REPORT_YYYY-MM-DD.md`
- Learning docs: `WHAT_WE_LEARNED_SESSION_YYYY-MM-DD.md`

### Session Documentation Template

When creating session documents, use this template:

```markdown
# 📅 Session YYYY-MM-DD HH:MM - [Brief Description]

## 🎯 Session Overview
- Start time, agent, planned work

## 📋 Project Context
- Current state, recent changes, priorities

## 🔄 Work Completed
- Accomplishments, files modified, issues resolved

## 🎯 Next Session Recommendations
- Suggested next steps, priorities, context for next agent
```

## 🔧 Agent Workflow

### Starting Work

1. Check docs structure (create if missing)
2. Gather current context
3. Create session document in appropriate directory
4. Update SESSION_LOG.md

### During Work

1. Maintain context awareness
2. Document significant decisions
3. Track progress against objectives

### Pausing Work

1. Create pause doc with current state
2. Update session doc
3. Update SESSION_LOG.md

### Resuming Work

1. Find latest pause doc
2. Restore full context
3. Continue from documented state

### Ending Work

1. Create session summary
2. Update project docs
3. Create learning doc if significant work

## 📋 Content Guidelines

### Core Documentation

- Keep content concise and focused
- Use consistent formatting and structure
- Include "Last updated" date at bottom of each file
- Use placeholders `[ ]` for content that needs to be filled in

### Session Documentation

- Be specific about accomplishments
- Note any blockers or issues encountered
- Provide clear context for next agent
- Include time stamps for major milestones

## 🔄 Integration with Project

### Documentation Locations

- Task work → `docs/tasks/[task-name]/sessions/`
- General work → `docs/sessions/general/`
- Learning → task-specific or `docs/sessions/learnings/`

### Cross-Referencing

- Link related documents where appropriate
- Reference specific sessions when documenting decisions
- Maintain consistency across all documentation

## 🚨 Special Considerations

### Security

- Never document sensitive credentials or keys
- Follow security best practices in all documentation
- Note any security considerations in relevant docs

### Performance

- Keep documentation focused and concise
- Use appropriate formatting for readability
- Avoid unnecessary duplication

### Maintenance

- Regularly review and update documentation
- Archive outdated sessions appropriately
- Maintain the SESSION_LOG.md as the master index

## 📞 Getting Help

If you're unsure about documentation requirements:

1. Check the Universal Document Rules in the project memory
2. Review existing session documents for examples
3. Follow the templates provided in this guide
4. When in doubt, document more rather than less

---

*Last updated: 2025-10-08*
