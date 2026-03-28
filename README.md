# llmenv v2 🚀

> .env is for secrets. .llmenv is for you.

An intelligent, dynamic context engine that solves the persistent problem of developers repeatedly explaining their stack, project context, and constraints to AI tools across multiple IDEs. 

With v2, **llmenv automatically scans your projects, syncs to your AI IDEs, and learns from AI mistakes.**

## The Problems llmenv Solves

1. **Repetitive Stack Explanations:** Stop typing *"I'm using Next.js with Tailwind and Prisma"* in every prompt.
2. **AI Ideology Drift:** Stop wrestling with AIs that refuse to use CSS modules when you tell them to.
3. **Repeated Mistakes:** When an AI gives you bad advice, how do you ensure it never happens again?
4. **Scattered Rules:** Manually copying context between `.cursorrules`, `.windsurfrules`, and GitHub Copilot.

---

## 🌟 What's New in v2?

### 1. Zero-Friction Auto-Scanning (`llmenv scan`)
No more pulling together your tech stack manually. Run `llmenv scan` and it will automatically read your `package.json`, `tsconfig.json`, directory structure, and environment variables.

### 2. Universal Auto-Sync (`llmenv sync`)
llmenv now automatically identifies your AI IDEs and syncs your context into their native formats. Every time you scan a project, add a pin, or change profiles, llmenv **silently auto-syncs** to:
- Cursor (`.cursor/rules`)
- Windsurf (`.windsurfrules`)
- GitHub Copilot (`.github/copilot-instructions.md`)
- Roo Code (`.roo/rules`)
- Cline (`.clinerules`)
- Continue (`.continue/rules`)
- Aider (`.aider.conf.yml`)

### 3. Smart Pins (The "AI Mistake Journal")
AIs make mistakes. When they do, pin it so they never do it again.
- **`llmenv pin "Never use inline styles" --learn`**: Prefixes the pin with `[LEARN]` to act as a harsh guardrail against repeated bad outputs.
- **`llmenv pin "Use describe/it format" --scope "*.test.ts"`**: Ensures rules only apply where relevant.

### 4. Expert Prompt Profiles
Profiles are no longer just "tones". They inject expert-level system prompts into your tools.
- `llmenv use build` (Ship fast, ignore boilerplate)
- `llmenv use review` (Injects security & a11y checklists)
- `llmenv use debug` (Forces step-by-step reasoning & diff outputs)
- `llmenv use refactor` (Forces DRY, SRP, and architectural focus)

### 5. Instant GitHub Identity
Pull your developer identity straight from GitHub without answering a 5-step questionnaire.
`llmenv identity --github yourusername`

---

## Installation

```bash
npm install -g llmenv
```

> **Requirements**: Node.js 18 or higher

## Quick Start

```bash
# 1. Setup your Global Identity (One-time)
llmenv identity --github <your-username>

# 2. Setup your project (in any codebase)
llmenv init

# 3. Auto-detect your tech stack!
llmenv scan

# 4. Train the AI on your preferences
llmenv pin "Always use strict mode" --scope "*.ts"
llmenv pin "Do not use useEffect for data fetching" --learn

# 5. Switch to a specific profile
llmenv use review
```

*That's it! As you run these commands, llmenv automatically generates and syncs the rules to Cursor, Windsurf, or whichever IDE you are using.*

## Example Generated Output

llmenv compresses your massive configuration into an extremely token-efficient header that gets injected into your IDE.

```markdown
<!-- LLMENV:START -->
[LLMENV] Dev: Rohan | Developer | GitHub verified
Stack: react@18, vite@5, tailwindcss@3, TypeScript Enabled (Strict Mode) | Aliases: @/*, @/components/*
Style: Direct, code-first, with examples
Profile: review → Code Review & Auditing
Rules: Format review as a checklist, Point out edge cases
Project: my-portfolio → A modern developer portfolio
Pins: [LEARN] Never use useEffect for data fetching | [Scope: *.css] Use CSS modules for component styles
<!-- LLMENV:END -->
```

## Available Commands

| Command | Description |
|---------|-------------|
| `llmenv init` | Initialize project configuration |
| `llmenv scan` | Auto-detect stack (package.json, tsconfig, structure) |
| `llmenv identity` | Configure who you are (`--github <username>`) |
| `llmenv use <profile>`| Switch to: `build`, `review`, `debug`, `learn`, `refactor` |
| `llmenv pin <fact>` | Save a rule (`--learn` / `--scope <pattern>`) |
| `llmenv sync` | Manually sync to IDE files (normally happens automatically) |
| `llmenv status` | View your current context configuration |

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

Made with ❤️ for developers who are tired of repeating themselves to AI tools.
