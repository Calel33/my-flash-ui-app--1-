### Research Phase
### Phase 2: Project Context Gathering
**Goal:** Gather project context and code structure

**Process:**
1. Examine current codebase structure
2. Identify files and modules that might be impacted
3. Map dependencies between frontend, backend, database, and APIs
4. Understand existing patterns and conventions
5. Assess current architecture and tech stack

**Checklist:**
- [ ] Identify files and modules that might be impacted
- [ ] Highlight dependencies between frontend, backend, database, and APIs
- [ ] Document existing patterns and conventions
- [ ] Map current architecture

**Output:** Comprehensive project task context analysis

2.2 Knowledge Base Search (if instructed)

**2.2.1 Archon RAG Search**
If Archon RAG is available and relevant:

Use mcp__archon__rag_get_available_sources() to see available documentation
Search for relevant patterns: mcp__archon__rag_search_knowledge_base(query="...")
Find code examples: mcp__archon__rag_search_code_examples(query="...")
Focus on implementation patterns, best practices, and similar features

**2.2.2 DeepWiki Documentation Search**
If DeepWiki is available and relevant:

Use mcp_deepwiki_read_wiki_structure(repoName="owner/repo") to explore repository documentation structure
Read comprehensive docs: mcp_deepwiki_read_wiki_contents(repoName="owner/repo") for complete documentation
Ask specific questions: mcp_deepwiki_ask_question(repoName="owner/repo", question="...")
Focus on understanding project architecture, API patterns, and implementation details

**2.2.3 OctoCode GitHub Search**
If OctoCode is available and relevant:

Search repositories: mcp_octocode_githubSearchRepositories(queries=[...]) for finding similar projects
Search code patterns: mcp_octocode_githubSearchCode(queries=[...]) for implementation examples
Explore repository structure: mcp_octocode_githubViewRepoStructure(queries=[...]) for project organization
Fetch specific files: mcp_octocode_githubGetFileContent(queries=[...]) for detailed code analysis
Search commits/PRs: mcp_octocode_githubSearchCommits(...) and mcp_octocode_githubSearchPullRequests(...) for change history
Find packages: mcp_octocode_packageSearch(...) for dependency research
Focus on real-world implementations, best practices, and community solutions

**2.2.4 Exa Web Research** ⭐ **NEW**
If Exa MCP tool is available and relevant:

Use web_search(search_term="...", explanation="...") for comprehensive web research
Focus on finding up-to-date information, best practices, and current trends

**Best Practices for Exa Web Research:**
- **Specific Queries**: Use precise, targeted search terms with relevant keywords
- **Version-Specific Searches**: Include version numbers for technology-specific research
- **Comparative Analysis**: Search for multiple approaches to compare solutions
- **Current Trends**: Focus on recent developments and emerging patterns
- **Documentation Research**: Look for official docs, API references, and guides

**Research Categories:**
1. **Best Practices**: Search for "best practices [technology] [feature]"
2. **Implementation Patterns**: Search for "[technology] implementation examples"
3. **Case Studies**: Search for "[technology] case studies production"
4. **Common Issues**: Search for "[technology] common problems solutions"
5. **Performance**: Search for "[technology] performance optimization"
6. **Security**: Search for "[technology] security patterns"
7. **Libraries/Tools**: Search for "best [technology] libraries [year]"

**Integration with Existing Research:**
- Cross-reference web findings with codebase patterns
- Validate external recommendations against project requirements
- Document discrepancies between best practices and current implementation
- Identify opportunities for improvement based on current trends

**Output:** 
Comprehensive project task context analysis: taskcontext{task_name}.md
Research.md: should be named RESEARCH{task_name}.md

## 📋 Research MD File Structure

### **1. Executive Summary**
- Task overview, key findings, recommendations

### **2. Project Context**
- Current architecture, impacted files, existing patterns

### **3. External Research**
- Archon RAG, DeepWiki, OctoCode findings
- **Web Research Findings** (Exa results)
  - Current best practices
  - Industry trends
  - Comparative analysis
  - Documentation references

### **4. Code Examples & Patterns** ⭐ **CRITICAL**
- **Working code snippets** (not pseudocode)
- **Multiple implementation approaches**
- **Complete TypeScript examples**
- **Database schema patterns**
- **Component patterns**
- **API integration patterns**
- **Testing patterns**
- **Web Research Examples** (from Exa findings)

### **5. Technical Analysis**
- Implementation approaches, pros/cons, performance, security
- **Web Research Validation**: How external findings align with project needs

### **6. Integration Points**
- Database changes, API endpoints, UI components, auth
- **External Dependencies**: Libraries/tools identified through web research

### **7. Next Steps**
- Implementation plan, success criteria
- **Research Follow-up**: Additional web research needed

## 🎯 Research Quality Requirements

**Code Examples Must Include:**
- [ ] **Working code snippets** - Actual runnable examples
- [ ] **Multiple approaches** - Different ways to solve the problem
- [ ] **Error handling** - Proper error handling patterns
- [ ] **TypeScript types** - Full type definitions
- [ ] **Integration examples** - How components work together
- [ ] **Testing patterns** - How to test the implementation

**Web Research Requirements:**
- [ ] **Current information** - Recent documentation and practices
- [ ] **Multiple sources** - Cross-reference findings from different sources
- [ ] **Practical examples** - Real-world implementations, not just theory
- [ ] **Version-specific** - Information relevant to current tech stack versions
- [ ] **Performance considerations** - Impact on system performance
- [ ] **Security implications** - Security best practices and considerations

**Minimum Requirements:**
- [ ] **3+ code examples** per major approach
- [ ] **Complete working examples** - Not just snippets
- [ ] **Context explanation** - Why each pattern is used
- [ ] **Comparison analysis** - Pros/cons of each approach
- [ ] **Web research validation** - External sources supporting recommendations

