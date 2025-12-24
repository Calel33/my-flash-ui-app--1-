How to use AGENTS.md?
1. Add AGENTS.md
Create an AGENTS.md file at the root of the repository. Most coding agents can even scaffold one for you if you ask nicely.
2. Cover what matters
Add sections that help an agent work effectively with your project. Popular choices:

Project overview
Build and test commands
Code style guidelines
Testing instructions
Security considerations
3. Add extra instructions
Commit messages or pull request guidelines, security gotchas, large datasets, deployment steps: anything you’d tell a new teammate belongs here too.
4. Large monorepo? Use nested AGENTS.md files for subprojects
Place another AGENTS.md inside each package. Agents automatically read the nearest file in the directory tree, so the closest one takes precedence and every subproject can ship tailored instructions. For example, at time of writing the main OpenAI repo has 88 AGENTS.md files.