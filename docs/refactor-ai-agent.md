# Refactor AI Agent

This project has a local AI refactor agent for architecture review. It is not part of the public site and does not modify production data.

## What It Does

- Runs the local architecture audit.
- Reads the project architecture rules.
- Collects a limited safe context from the repository.
- Sends that context to the OpenAI Responses API.
- Saves the result to `tmp/refactor-ai-agent-report.md`.

## What It Does Not Do

- It does not edit files automatically.
- It does not commit or push.
- It does not read `.env.local` into the prompt.
- It does not touch MySQL, Supabase, or production data.

## Setup

Create or update `.env.local` locally:

```text
OPENAI_API_KEY=your_key_here
OPENAI_REFACTOR_MODEL=gpt-5.2
OPENAI_REFACTOR_MAX_OUTPUT_TOKENS=5000
```

Do not commit `.env.local`.

## Commands

Run a real AI review:

```powershell
npm run refactor:ai -- --task "Проверь архитектуру ПТО и предложи следующий безопасный рефакторинг"
```

Run without AI, only to verify context collection:

```powershell
npm run refactor:ai -- --offline
```

Show help:

```powershell
npm run refactor:ai -- --help
```

## Safe Workflow

1. Run `npm run refactor:ai -- --task "..."`
2. Read `tmp/refactor-ai-agent-report.md`.
3. Convert useful recommendations into small code tasks.
4. Run `npm run verify`.
5. Commit only reviewed changes.

The agent is an assistant for planning and review. Code changes still go through the normal project rules in `AGENTS.md`, `ARCHITECTURE.md`, and `CODE_REVIEW.md`.
