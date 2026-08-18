# argil-cli

CLI for the [Argil.ai](https://argil.ai) video API. Made with [api2cli.dev](https://api2cli.dev).

Generate AI avatar videos: manage avatars, voices, videos, assets, webhooks, and subtitles.

## Install

```bash
npx api2cli install Nardjo/argil-cli
```

This clones the repo, builds the CLI, links it to your PATH, and installs the AgentSkill to your coding agents.

## Install AgentSkill only

```bash
npx skills add Nardjo/argil-cli
```

## Auth

```bash
argil-cli auth set "your-x-api-key"
argil-cli auth test
```

Token is stored in `~/.config/tokens/argil-cli.txt` and sent as the `x-api-key` header to `https://api.argil.ai/v1`.

## Quick start

```bash
# Discover IDs
argil-cli avatars list --json
argil-cli voices list --language ENGLISH --json

# Create + render a single-moment video
argil-cli videos create --name "Hello" \
  --transcript "Hi, welcome to our product." \
  --avatar-id <avatar-id> --voice-id <voice-id> --json
argil-cli videos render <video-id> --json

# Poll status / download URL
argil-cli videos get <video-id> --json
```

## Resources

| Resource    | Actions                                      |
|-------------|----------------------------------------------|
| `avatars`   | `list`, `get`                                |
| `voices`    | `list`, `get`, `sync`                        |
| `videos`    | `list`, `get`, `create`, `render`, `delete`  |
| `assets`    | `list`, `get`, `create`, `delete`            |
| `webhooks`  | `list`, `create`, `update`, `delete`         |
| `subtitles` | `list`, `export`                             |

Run `argil-cli <resource> --help` for flags.

## Global Flags

All commands support: `--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

## Docs

- API: https://docs.argil.ai
- Agent skill: `skills/argil-cli/SKILL.md`
