# llmenv

> .env is for secrets. .llmenv is for you.

An enterprise-grade CLI tool that solves the persistent problem of developers repeatedly explaining their stack, project context, and constraints to AI tools in every session. Store your developer context once, use it everywhere.

## Why llmenv?

Every time you start a new AI conversation, you find yourself typing the same things:

- "I'm using Python with FastAPI and Supabase..."
- "Avoid AWS, I'm using Cloudflare..."
- "This is a solo project with limited time..."
- "Remember, we're using TypeScript strict mode..."

**llmenv eliminates this repetition.** Define your context once, and it automatically wraps every AI prompt with the right information.

## Features

- **Persistent Identity Layer**: Store your developer context once, use it everywhere
- **Profile Switching**: Adapt your AI context to different working modes (work/build/personal/learn)
- **Auto-Detection**: Git-style directory traversal automatically finds your project context
- **Pin Management**: Keep important facts persistent across all AI conversations
- **Context Injection**: Automatically wrap your prompts with relevant context
- **Project Registry**: Manage multiple projects with ease
- **AI Integration**: Direct API calls to OpenAI and Claude with context injection
- **Decision History**: Track AI suggestions per project
- **Cross-Platform**: Works on Mac, Linux, and Windows

## Installation

```bash
npm install -g llmenv
```

**Requirements**: Node.js 18 or higher

## Quick Start

```bash
# Initialize a new project
cd your-project
llmenv init

# View your current context
llmenv status

# Switch profiles
llmenv use work

# Add a persistent fact
llmenv pin "Always use TypeScript strict mode"

# Configure AI provider
llmenv config

# Send a prompt with context
llmenv inject "How should I structure my API?"
```

## Usage Examples

### Project Initialization

Initialize llmenv in your project directory:

```bash
$ llmenv init
? Project name: AI Content Studio
? Stack (comma-separated): Python, FastAPI, Supabase, Redis, Cloudflare R2
? Technologies to avoid (comma-separated): AWS, Firebase, Docker in dev
? Project context: Bootstrapped SaaS, solo dev, <5hrs/week
? Priorities (comma-separated): Ship fast, cheap infra, minimal dependencies

✓ Project "AI Content Studio" initialized successfully

Configuration saved to: /Users/john/projects/ai-content-studio/.llmenv
```

This creates a `.llmenv` file in your project root and registers it in the global project registry.

### Viewing Current Context

See your complete merged context:

```bash
$ llmenv status

📋 Current Context

[CONTEXT]

=== Global Identity ===
Name: John Doe
Role: Full-stack Developer
Experience: 5 years
Preferences: TypeScript, functional programming, minimal dependencies

=== Active Profile: work ===
Focus: Production code
Priorities: Reliability, maintainability, performance
Constraints: Must follow company coding standards

=== Current Project: AI Content Studio ===
Stack: Python, FastAPI, Supabase, Redis, Cloudflare R2
Avoid: AWS, Firebase, Docker in dev
Context: Bootstrapped SaaS, solo dev, <5hrs/week
Priorities: Ship fast, cheap infra, minimal dependencies

=== Pinned Facts (2) ===
• Using Cloudflare R2 not S3
• Supabase for auth + DB + storage

[END CONTEXT]

✓ Project: AI Content Studio

Active profile: work
Pins: 2
```

### Profile Switching

Switch between different working modes:

```bash
$ llmenv use build

✓ Switched to profile: build
```

Available profiles:
- **work**: Production code, reliability-focused
- **build**: Side projects, ship fast
- **personal**: Learning and exploration
- **learn**: Tutorials and documentation

### Managing Projects

View all registered projects:

```bash
$ llmenv projects

📁 Registered Projects

Name                Path                                     Last Active
────────────────────────────────────────────────────────────────────────
AI Content Studio   /Users/john/projects/ai-content-studio  2 hours ago
llmenv              /Users/john/projects/llmenv              1 day ago
client-app          /Users/john/projects/client-app          3 days ago
```

Switch between projects interactively:

```bash
$ llmenv switch
? Select a project: (Use arrow keys)
❯ AI Content Studio (/Users/john/projects/ai-content-studio)
  llmenv (/Users/john/projects/llmenv)
  client-app (/Users/john/projects/client-app)

✓ Switched to project: AI Content Studio
Path: /Users/john/projects/ai-content-studio
```

### Pin Management

Add persistent facts that apply everywhere:

```bash
$ llmenv pin "Using Cloudflare R2 not S3"

✓ Pin added: a1b2c3d4
  Using Cloudflare R2 not S3
```

View all pins:

```bash
$ llmenv pins

📌 Pinned Facts

1. [a1b2c3d4] Using Cloudflare R2 not S3
   Created: 2024-03-10 09:00:00

2. [b2c3d4e5] Supabase for auth + DB + storage
   Created: 2024-03-10 09:01:00

3. [c3d4e5f6] No microservices, monolith for now
   Created: 2024-03-10 09:02:00
```

Remove a pin:

```bash
$ llmenv unpin a1b2c3d4

✓ Pin removed: a1b2c3d4
  Using Cloudflare R2 not S3
```

### AI Integration

Configure your AI provider (one-time setup):

```bash
$ llmenv config
? Select AI provider: (Use arrow keys)
❯ OpenAI (GPT-4)
  Claude (Anthropic)

? Enter API key: ************************************

✓ AI provider configured successfully
```

Preview how your prompt will be wrapped (dry run):

```bash
$ llmenv inject --dry "How do I queue video uploads?"

[CONTEXT]

=== Global Identity ===
Name: John Doe
Role: Full-stack Developer
...

=== Current Project: AI Content Studio ===
Stack: Python, FastAPI, Supabase, Redis
...

[END CONTEXT]

How do I queue video uploads?
```

Send a prompt with context to AI:

```bash
$ llmenv inject "How do I queue video uploads?"

⠋ Calling AI...

✓ Response received

📝 AI Response

For your FastAPI + Redis setup, I recommend using Celery with Redis as the broker.
Here's how to implement it:

1. Install Celery:
   pip install celery[redis]

2. Create a Celery app (celery_app.py):
   from celery import Celery
   
   app = Celery('tasks', broker='redis://localhost:6379/0')
   
   @app.task
   def process_video_upload(video_id: str):
       # Your video processing logic here
       pass

3. In your FastAPI endpoint:
   from fastapi import BackgroundTasks
   from celery_app import process_video_upload
   
   @app.post("/upload")
   async def upload_video(file: UploadFile):
       # Save file to Cloudflare R2
       video_id = await save_to_r2(file)
       
       # Queue processing task
       process_video_upload.delay(video_id)
       
       return {"video_id": video_id, "status": "queued"}

This approach keeps your API responsive while handling video processing asynchronously.

Model: gpt-4
Tokens: 245 (120 prompt + 125 completion)
```

### Decision History

View AI decision history for your current project:

```bash
$ llmenv history

📜 Decision History

2024-03-15 14:30:00 [claude]

Prompt:
  How do I queue video uploads?

Response:
  For your FastAPI + Redis setup, I recommend using Celery with Redis as the broker...

────────────────────────────────────────────────────────────

2024-03-14 16:45:00 [claude]

Prompt:
  Best way to handle video thumbnails?

Response:
  Since you're using Cloudflare R2, you can leverage Cloudflare Images...
```

## Architecture Overview

llmenv uses a three-layer context merging system:

```
┌─────────────────────────────────────────────────────┐
│           ~/.llmenv/ (Single Source of Truth)       │
│                                                      │
│  ├── default.json          (Global Identity)        │
│  ├── active                (Active Profile Name)    │
│  ├── profiles/                                      │
│  │   ├── work.json                                  │
│  │   ├── build.json                                 │
│  │   ├── personal.json                              │
│  │   └── learn.json                                 │
│  ├── projects.json         (Project Registry)       │
│  ├── pins.json             (Persistent Facts)       │
│  ├── settings.json         (AI API Configuration)   │
│  └── history/              (Per-Project Decisions)  │
└──────────────────────────────────────────────────────┘
```

### Context Merging

When you run a command, llmenv automatically merges:

1. **Global Identity** - Your base developer profile
2. **Active Profile** - Current working mode (work/build/personal/learn)
3. **Project Context** - Project-specific stack and constraints (auto-detected)
4. **Pins** - Persistent facts that apply everywhere

Later layers override earlier ones, ensuring project-specific settings take precedence.

### Auto-Detection

Like Git, llmenv automatically finds your project context by walking up the directory tree from your current location until it finds a `.llmenv` file. This means you can run llmenv commands from any subdirectory in your project.

## Command Reference

### Project Commands

| Command | Description |
|---------|-------------|
| `llmenv init` | Initialize a new project in current directory |
| `llmenv projects` | List all registered projects |
| `llmenv switch` | Interactively switch between projects |

### Context Commands

| Command | Description |
|---------|-------------|
| `llmenv status` | Show current merged context |
| `llmenv use <profile>` | Switch active profile (work/build/personal/learn) |

### Pin Commands

| Command | Description |
|---------|-------------|
| `llmenv pin '<fact>'` | Add a persistent fact |
| `llmenv pins` | List all pins |
| `llmenv unpin <id>` | Remove a pin by ID |

### AI Commands

| Command | Description |
|---------|-------------|
| `llmenv config` | Configure AI provider and API key |
| `llmenv inject '<prompt>'` | Send prompt with context to AI |
| `llmenv inject --dry '<prompt>'` | Preview wrapped prompt without API call |
| `llmenv history` | View decision history for current project |

### Global Options

| Option | Description |
|--------|-------------|
| `--help` | Show help for any command |
| `--version` | Show version number |

## Configuration Files

All configuration is stored in `~/.llmenv/`:

### Global Identity (`default.json`)

Your base developer profile:

```json
{
  "name": "John Doe",
  "role": "Full-stack Developer",
  "experience": "5 years",
  "preferences": [
    "TypeScript",
    "Functional programming",
    "Minimal dependencies"
  ],
  "communication": "Concise, technical, with examples"
}
```

### Profile (`profiles/work.json`)

Context for different working modes:

```json
{
  "name": "work",
  "focus": "Production code",
  "priorities": [
    "Reliability",
    "Maintainability",
    "Performance"
  ],
  "constraints": [
    "Must follow company coding standards"
  ],
  "tone": "Professional and thorough"
}
```

### Project Configuration (`.llmenv`)

Project-specific context in your project root:

```json
{
  "project": "AI Content Studio",
  "stack": [
    "Python",
    "FastAPI",
    "Supabase",
    "Redis",
    "Cloudflare R2"
  ],
  "avoid": [
    "AWS",
    "Firebase"
  ],
  "context": "Bootstrapped SaaS, solo dev, <5hrs/week",
  "priorities": [
    "Ship fast",
    "Cheap infrastructure"
  ]
}
```

## Contributing

Contributions are welcome! We'd love your help making llmenv better.

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/yourusername/llmenv.git`
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/amazing-feature`

### Development Workflow

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

### Testing

We use a dual testing approach:

- **Unit Tests**: Verify specific examples and edge cases
- **Property-Based Tests**: Verify universal properties across all inputs

All tests use Vitest and fast-check. Tests are located in the `tests/` directory.

### Pull Request Guidelines

1. Write tests for new features
2. Ensure all tests pass: `npm test`
3. Follow the existing code style
4. Update documentation as needed
5. Write clear commit messages
6. Keep PRs focused on a single feature or fix

### Code of Conduct

Be respectful, inclusive, and constructive. We're all here to build something useful together.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: Report bugs and request features via [GitHub Issues](https://github.com/yourusername/llmenv/issues)
- **Discussions**: Join our community discussions for questions and ideas

## Roadmap

### Phase 1 (Current)
- ✅ Core CLI implementation
- ✅ Context management and merging
- ✅ Project registry and auto-detection
- ✅ Pin management
- ✅ AI integration (OpenAI, Claude)
- ✅ Decision history tracking

### Phase 2 (Planned)
- Team collaboration features
- Shared context repositories
- Context templates and presets

### Phase 3 (Future)
- Advanced AI integrations
- Custom AI provider support
- Context analytics and insights

### Phase 4 (Future)
- Plugin system for extensibility
- IDE integrations
- Web dashboard

## FAQ

**Q: Is my API key secure?**  
A: Yes. Your API key is stored locally in `~/.llmenv/settings.json` with restricted file permissions. It never leaves your machine except when making API calls to your chosen provider.

**Q: Can I use llmenv without AI integration?**  
A: Absolutely! You can use `llmenv inject --dry` to get formatted context that you can copy-paste into any AI tool manually.

**Q: Does llmenv work with other AI providers?**  
A: Currently, llmenv supports OpenAI and Claude. We're planning to add more providers in future releases.

**Q: How do I edit my global identity or profiles?**  
A: Edit the JSON files directly in `~/.llmenv/`. They're human-readable and well-structured.

**Q: Can I use llmenv in a team?**  
A: Phase 1 is designed for solo developers. Team collaboration features are planned for Phase 2.

**Q: What if I have multiple projects with the same name?**  
A: llmenv uses absolute paths to distinguish projects, so multiple projects with the same name are supported.

---

Made with ❤️ for developers who are tired of repeating themselves to AI tools.
