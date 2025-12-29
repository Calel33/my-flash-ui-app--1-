AI Agent Compliance Standard (RFC)

Version: 3.0 — Always Apply
Status: Active — Overrides All Previous Instructions

0. PRIORITY LEVELS
P0 — MUST. Non-compliance invalidates output. HALT & request clarification.
P1 — SHOULD. Justify if bypassed.
P2 — MAY. Optional; context-dependent.
P3 — OPTIONAL. Preference or guidance.


Failure State → If ANY P0 rule is violated, the agent MUST immediately respond:

❌ P0 Violation — Output Aborted.
Reason: {state violation}
Required: {exact missing information}

1. TOOL USAGE
P0 MUST — Primary Tools

MCP codebase-retrieval tool MUST be used for:

Semantic code search

Code architecture understanding

Symbol and dependency mapping

Modification planning

P0 MUST NOT — Misuse of Tools

Bash/Grep MUST NOT be used for:

Architecture / symbol reasoning

Semantic search

Planning or feature mapping

P1 MAY — Limited Use

Bash/Grep MAY be used only for:

Exact string search

Logs / config / error text matching

STOP WORDS — Immediate HALT

If any appear, HALT before continuing:

"not sure"
"uncertain"
"guess"
"probably"
"unknown"
"missing info"
"can't locate"
"not confident"
"unsure path"

2. TASK START PROTOCOL (P0 MUST)

Before taking ANY action:

Requirement	Priority
Retrieve relevant files via MCP	P0 MUST
Identify all involved symbols/modules	P0 MUST
Map dependencies & affected systems	P0 MUST
Build a minimal execution plan if complex	P1 SHOULD
Confirm user intent if ambiguous	P0 MUST

If context retrieval is skipped → Output VOID.

3. PROMPT RESPONSE PROTOCOL (P0 MUST)

When a user provides a prompt:

Execution Behaviors
P0 MUST — Do not guess.
P0 MUST — Do not assume missing requirements.
P0 MUST — Preserve existing behavior and architecture unless explicitly instructed otherwise.
P0 MUST — Scan available skills and load ONLY those relevant to the task.
P0 MUST — Use loaded skills as the primary source of truth.
P0 MUST — Pull proven patterns / workflows BEFORE planning or coding.
P0 MUST — Request clarification ONLY when execution is unsafe or incorrect without it.
P1 SHOULD — Minimize clarifying questions; be self-sufficient.

Default Operating Loop
Skills → Think → Plan (if needed) → Act

HALT if tasks require guessing or risk breaking architecture

Agents MUST stop and request one of:

missing path

missing dependency detail

missing specification

missing file scope

missing architectural context

4. FILE EDITING RULES (P0 MUST)

Before modifying any file:

Action	Rule
Read entire file	P0 MUST
Understand local + global context	P0 MUST
Confirm line numbers & scope	P0 MUST
Preserve existing functionality	P0 MUST
No deletion without permission	P0 MUST
Ask if multiple domains are affected	P0 MUST

Additional design constraints:

Single responsibility per file (P0 MUST)

Max ~500 lines before refactor suggestion (P1 SHOULD)

Modular composition > inheritance (P1 SHOULD)

5. DESIGN SYSTEM RULES

Applies to all UI, styling, and component work.

P0 MUST

Use design system tokens for:

Color

Typography

Spacing

Radius

Shadows

P0 MUST NOT

Hard-coded colors or spacing

Inline style overrides

New tokens added without request/approval

If a token is missing → HALT and request token addition.

6. ARCHITECTURE
P0 MUST

Preserve vertical slice architecture

Confirm pathing before creating files

Validate domain boundaries before changes

Uphold existing data flow patterns

P1 SHOULD

Use composition patterns

Co-locate tests with features

7. CHANGE PROPAGATION

Before implementing ANY change, agent MUST:

P0 Identify all impacted domains
P0 Map all affected systems (UI, server, DB, tests, styling)
P0 Verify dependencies are updated
P0 Confirm execution will not break cross-domain features


If ANY part is unknown or unverified → HALT

8. AGENT BEHAVIOR
Prohibited (P0 MUST NOT)

Invent APIs or functions

Assume missing behaviors

Alter architecture without permission

Continue execution after uncertainty

Provide partial or speculative output

Required (P0 MUST)

Confirm tools, files, and symbols BEFORE usage

Ask when blocked by safety or correctness

Deliver output with self-audited compliance

9. OUTPUT FORMAT REQUIREMENT
All final responses MUST conclude with:
Compliance Report:
- P0: PASS
- P1: PASS / Justified if missed
- Violations: None


If any violation is present, the agent MUST NOT provide a solution.
Only the violation report is allowed.

10. EMERGENCY STOP

At any point, if continued execution risks:

breaking P0 rule

breaking architecture

guessing

unsafe assumptions

Agent responds ONLY with:

🛑 HALT — Blocked by P0 rule
Reason: {specific reason}
Required to Continue: {exact info needed}

11. COMPLETION GATE

A task is not complete unless ALL of the following are true:

Gate Requirement	Status
MCP Context Verified	REQUIRED
No Assumptions Made	REQUIRED
Architecture Preserved	REQUIRED
Dependencies Mapped	REQUIRED
Design System Followed	REQUIRED
Compliance Report Attached	REQUIRED

Any missing item = INVALID OUTPUT