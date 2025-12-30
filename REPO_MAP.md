# Repository Map

Generated on: 12/29/2025, 8:33:39 PM

```text
└── my-flash-ui-app (1)/
    ├── agent/
    │   └── CleanCodeImplementer.md
    ├── ai/
    │   ├── errors.ts
    │   ├── gemini.ts
    │   ├── generate.ts
    │   ├── glm.ts
    │   ├── glmClient.ts
    │   ├── glmSmokeTest.ts
    │   ├── openrouter.ts
    │   ├── providers.ts
    │   └── sseParser.ts
    ├── backup_temp/
    │   └── index_original_29-12-2025_163940.tsx
    ├── command/
    │   ├── Always.md
    │   ├── APP_ARCHITECTURE.md
    │   ├── confidence-check.md
    │   ├── constitution.md
    │   ├── create-prompt.md
    │   ├── datamodel.md
    │   ├── diff.md
    │   ├── filefinder.md
    │   ├── generate-agents.md
    │   ├── generate-project-context.md
    │   ├── generate-stack-plan.md
    │   ├── go.md
    │   ├── html-to-react.md
    │   ├── learner.md
    │   ├── MASTER_PROMPT_HTML_INTEGRATION.md
    │   ├── MASTER_PROMPT.md
    │   ├── mcp-converter.md
    │   ├── MP2.md
    │   ├── octocode-generate-project-command.md
    │   ├── octocode-plan-command.md
    │   ├── octocode-research-command.md
    │   ├── octocode-review-pull-request-command.md
    │   ├── octocode-review-security-command.md
    │   ├── openspec-apply.md
    │   ├── openspec-archive.md
    │   ├── openspec-proposal.md
    │   ├── orchestrate-feature.md
    │   ├── project-definition-agent.md
    │   ├── refactor.md
    │   ├── research_codebase-v2.md
    │   ├── research_codebase.md
    │   ├── task-completion-validator.md
    │   └── ui-mode.md
    ├── components/
    │   ├── ActionBar.tsx
    │   ├── AppShell.tsx
    │   ├── ArtifactCard.tsx
    │   ├── DottedGlowBackground.tsx
    │   ├── DrawerContent.tsx
    │   ├── ElementEditor.tsx
    │   ├── EmptyState.tsx
    │   ├── GlmLoadingIndicator.tsx
    │   ├── Icons.tsx
    │   ├── ImportDesignPanel.tsx
    │   ├── PromptBar.tsx
    │   ├── PromptPopup.tsx
    │   ├── SessionGrid.tsx
    │   └── SideDrawer.tsx
    ├── docs/
    │   ├── core/
    │   │   ├── rules/
    │   │   │   └── AGENTS.md
    │   │   ├── API_REFERENCE.md
    │   │   ├── ARCHITECTURE.md
    │   │   ├── BUG_LOG.md
    │   │   ├── DEVELOPMENT_GUIDE.md
    │   │   ├── PRODUCT_BRIEF.md
    │   │   ├── PROJECT_PROGRESS.md
    │   │   └── USER_GUIDE.md
    │   ├── Design-system/
    │   ├── guides/
    │   ├── memory/
    │   │   ├── constitution_update_checklist.md
    │   │   └── constitution.md
    │   ├── project-files/
    │   │   └── PRIME_CONTEXT.md
    │   ├── sessions/
    │   │   ├── endings/
    │   │   ├── general/
    │   │   │   ├── SESSION_2025-10-08_INITIAL_SETUP.md
    │   │   │   ├── SESSION_2025-12-29_PHASE1_SAFETY_NET.md
    │   │   │   └── SESSION_2025-12-29_PHASE2_HOOKS_EXTRACTION.md
    │   │   ├── handoffs/
    │   │   │   ├── HANDOFF_2025-12-29_PHASE2_HOOKS_PROGRESS.md
    │   │   │   └── HANDOFF_2025-12-29_PHASE2_KICKOFF.md
    │   │   ├── learnings/
    │   │   └── pauses/
    │   │       └── PAUSE_2025-12-29_PHASE2_HOOKS_PROGRESS.md
    │   ├── tasks/
    │   │   └── example-task/
    │   │       ├── learnings/
    │   │       ├── sessions/
    │   │       ├── validation/
    │   │       └── README.md
    │   ├── AGENTS.md
    │   ├── README.md
    │   └── SESSION_LOG.md
    ├── hooks/
    │   ├── useArtifactGeneration.ts
    │   ├── useDrawer.ts
    │   ├── useDrawerActions.ts
    │   ├── useDrawerOpeners.ts
    │   ├── useElementEditor.ts
    │   ├── useIframeSelection.ts
    │   ├── useLibrary.ts
    │   ├── usePreferences.ts
    │   ├── useSessionMutations.ts
    │   ├── useSessionNavigation.ts
    │   ├── useSnippetConversion.ts
    │   ├── useSurpriseMe.ts
    │   └── useVariations.ts
    ├── prompts/
    │   ├── 001-import-design-html-uploads.md
    │   ├── 002-add-glm-provider-research.md
    │   ├── 003-glm-loading-indicator.md
    │   ├── 004-artifacts-fullscreen-input-popup.md
    │   ├── 005-expanded-prompt-input-caret.md
    │   ├── 006-pin-bottom-bar-micro-interactions.md
    │   ├── 007-fix-design-system-duplicate-refs.md
    │   ├── 008-css-design-tokens-and-accessibility.md
    │   ├── 009-action-bar-toggle-and-prompt-cleanup.md
    │   ├── 010-backend-api-proxy-server.md
    │   ├── 011-openrouter-provider-research.md
    │   └── 012-comparison-mode-multi-provider.md
    ├── reports/
    │   └── refactor/
    │       ├── refactor_index_27-12-2025_030100.md
    │       ├── refactor_index_27-12-2025_040500.md
    │       └── refactor_index_tsx_29-12-2025_163940.md
    ├── research/
    │   ├── glm-provider-diff-stack-plan.md
    │   ├── glm-provider-implementation-plan.md
    │   ├── glm-provider-integration.md
    │   └── openrouter-provider-integration.md
    ├── server/
    │   ├── .env
    │   ├── .env.example
    │   ├── package.json
    │   ├── proxy.ts
    │   └── tsconfig.json
    ├── skills/
    │   ├── exa-research/
    │   │   ├── references/
    │   │   │   ├── query_patterns.md
    │   │   │   └── search_strategies.md
    │   │   ├── scripts/
    │   │   │   ├── query_optimizer.py
    │   │   │   └── research_workflow.py
    │   │   ├── README.md
    │   │   ├── SKILL.md
    │   │   ├── test_skill.py
    │   │   └── USAGE_EXAMPLES.md
    │   ├── graphite-cli/
    │   │   ├── references/
    │   │   │   ├── diffstackflow.md
    │   │   │   └── graphite_cli_guide.md
    │   │   └── SKILL.md
    │   ├── nextjs16-core/
    │   │   ├── assets/
    │   │   │   └── app-router-starter/
    │   │   │       ├── app/
    │   │   │       │   ├── dashboard/
    │   │   │       │   │   ├── error.tsx
    │   │   │       │   │   ├── loading.tsx
    │   │   │       │   │   └── page.tsx
    │   │   │       │   ├── layout.tsx
    │   │   │       │   ├── page.tsx
    │   │   │       │   └── proxy.ts
    │   │   │       ├── next.config.ts
    │   │   │       └── README.md
    │   │   ├── references/
    │   │   │   ├── core-workflows.md
    │   │   │   ├── NEXTJS_16_COMPLETE_GUIDE.md
    │   │   │   ├── nextjs16-advanced-patterns.md
    │   │   │   ├── nextjs16-migration-playbook.md
    │   │   │   └── nextjs16-reference.md
    │   │   ├── scripts/
    │   │   │   └── bootstrap-nextjs16.ps1
    │   │   └── SKILL.md
    │   ├── react-19/
    │   │   ├── references/
    │   │   │   ├── advanced-examples.md
    │   │   │   ├── core-workflows.md
    │   │   │   ├── hooks-api.md
    │   │   │   ├── migration-patterns.md
    │   │   │   ├── security-guide.md
    │   │   │   └── upgrade-checklist.md
    │   │   └── SKILL.md
    │   └── tailwindv4/
    │       ├── referenes/
    │       │   ├── breaking-changes.md
    │       │   ├── configuration-guide.md
    │       │   ├── performance-tuning.md
    │       │   └── tailwind-v4-quick-reference.md
    │       ├── scripts/
    │       │   └── migrate-v3-to-v4.sh
    │       ├── FILE_MANIFEST.txt
    │       ├── README.md
    │       └── SKILL.md
    ├── system-rules/
    │   └── AGENTS.md
    ├── tests/
    │   ├── app.smoke.test.tsx
    │   ├── element-editor.smoke.test.tsx
    │   ├── setup.ts
    │   └── variations-parser.test.ts
    ├── tools/
    │   └── map-generator/
    │       ├── generate.js
    │       └── README.md
    ├── .env.local.example
    ├── .gitignore
    ├── constants.ts
    ├── index.css
    ├── index.html
    ├── index.tsx
    ├── metadata.json
    ├── package.json
    ├── README.md
    ├── tsconfig.json
    ├── types.ts
    ├── utils.ts
    ├── vite-env.d.ts
    └── vite.config.ts
```
