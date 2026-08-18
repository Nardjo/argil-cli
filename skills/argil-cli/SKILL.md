---
name: argil-cli
description: "Operate the Argil.ai video API via argil-cli: avatars, voices, videos (create/render), assets, webhooks, and subtitle export. Use for AI avatar video generation workflows."
category: "video"
---

# argil-cli

Agent-ready CLI for the Argil.ai public API (`https://api.argil.ai/v1`). Auth uses an API key in the `x-api-key` header.

## When To Use This Skill

- List avatars/voices and pick IDs for video generation
- Create a video (moments + transcript), render it, poll status, delete
- Upload B-roll assets from a public URL
- Subscribe to generation/training webhooks
- Export VTT/ASS subtitles for a finished video project

## Setup

```bash
bun --version || curl -fsSL https://bun.sh/install | bash
export PATH="$HOME/.bun/bin:$HOME/.local/bin:$PATH"
npx api2cli bundle argil
npx api2cli link argil
```

CLI path after link: `~/.local/bin/argil-cli` → `~/.cli/argil-cli/dist/argil-cli.js`

Always pass `--json` for agent-driven calls.

## Authentication

```bash
argil-cli auth set "YOUR_API_KEY"
argil-cli auth test
argil-cli auth show
argil-cli auth remove
```

Token file: `~/.config/tokens/argil-cli.txt`

## Typical video workflow

1. `argil-cli avatars list --visibility private --json` — pick an `IDLE` avatar `id`
2. `argil-cli voices list --language ENGLISH --json` — pick a voice `id`
3. Create:
   ```bash
   argil-cli videos create --name "Demo" \
     --transcript "Hello from Argil." \
     --avatar-id AVATAR_ID --voice-id VOICE_ID \
     --aspect-ratio 16:9 --subtitles true --json
   ```
4. `argil-cli videos render VIDEO_ID --json` (optional `--callback-url https://...`)
5. Poll `argil-cli videos get VIDEO_ID --json` until `status` is `DONE` (or `FAILED`)
6. Read `videoUrl` / `videoUrlSubtitled` from the response
7. Optional: `argil-cli subtitles export VIDEO_ID --export-format vtt --out captions.vtt`

Multi-moment create (JSON array, each moment needs `avatarId` + `transcript` or `audioUrl`):

```bash
argil-cli videos create --name "Multi" --moments-file ./moments.json --json
# or
argil-cli videos create --name "Multi" --moments '[{"transcript":"Hi","avatarId":"...","voice":{"id":"..."}}]' --json
```

## Resources

### avatars
| Command | Flags |
|---------|-------|
| `avatars list` | `--orientation ASPECT_RATIO_16_9\|ASPECT_RATIO_9_16`, `--model ARGIL_V1\|ARGIL_ATOM`, `--visibility public\|private` |
| `avatars get <id>` | |

### voices
| Command | Flags |
|---------|-------|
| `voices list` | `--language ENGLISH\|FRENCH\|...`, `--gender MALE\|FEMALE`, `--visibility public\|private` |
| `voices get <id>` | |
| `voices sync` | `--provider-name ELEVEN_LABS\|MINIMAX` (omit = sync all connected providers) |

### videos (primary)
| Command | Flags |
|---------|-------|
| `videos list` | `--page`, `--limit`, `--name-search` / `--nameSearchQuery`, `--avatar-id`, `--voice-id`, `--extras-filter <json>` |
| `videos get <id>` | |
| `videos create` | **required** `--name`; moments via `--moments <json>` **or** `--moments-file <path>` **or** `--transcript` + `--avatar-id` (+ optional `--voice-id`); optional `--aspect-ratio 16:9\|9:16`, `--subtitles true\|false`, `--subtitle-style-id`, `--model ARGIL_V1\|ARGIL_ATOM` |
| `videos render <id>` | `--callback-url` (HTTPS one-shot webhook) |
| `videos delete <id>` | |

List JSON includes `{ videos, totalItems, totalPages, currentPage, itemsPerPage }`.

Video statuses: `IDLE`, `GENERATING_AUDIO`, `GENERATING_VIDEO`, `DONE`, `FAILED`.

### assets
| Command | Flags |
|---------|-------|
| `assets list` | |
| `assets get <id>` | poll until `status` is `READY` |
| `assets create` | **required** `--name`, `--type IMAGE\|VIDEO`, `--url` (public URL) |
| `assets delete <id>` | |

### webhooks
| Command | Flags |
|---------|-------|
| `webhooks list` | |
| `webhooks create` | **required** `--callback-url`, `--events` (comma-separated) |
| `webhooks update <id>` | `--callback-url`, `--events` (PUT) |
| `webhooks delete <id>` | |

Events: `VIDEO_GENERATION_SUCCESS`, `VIDEO_GENERATION_FAILED`, `AVATAR_TRAINING_SUCCESS`, `AVATAR_TRAINING_FAILED`

### subtitles
| Command | Flags |
|---------|-------|
| `subtitles list` | `--page`, `--page-size` (styles) |
| `subtitles export <videoProjectId>` | `--export-format vtt\|ass` (not `--format`), `--include-styling`, `--out <file>` |

Export returns raw VTT/ASS text to stdout (or `--out`). Use `--json` to wrap as `{ content, format }`.

## Working Rules

- Prefer `--json` for all programmatic calls.
- Do not invent an API key; ask the user to run `auth set` if missing.
- Prefer read (`list`/`get`) before mutate (`create`/`render`/`delete`).
- Avatar create (multipart) and voice audio create are intentionally not exposed.
- Global `--format` is CLI output format; subtitle file format is `--export-format`.

## Output Format

`--json` envelope:

```json
{ "ok": true, "data": { ... }, "meta": { "total": 42 } }
```

Error: `{ "ok": false, "error": { "message": "...", "status": 401 } }`

## Global Flags

`--json`, `--format <text|json|csv|yaml>`, `--verbose`, `--no-color`, `--no-header`

Exit codes: 0 success, 1 API error, 2 usage error

## Quick Reference

```bash
argil-cli --help
argil-cli videos --help
argil-cli videos create --help
argil-cli subtitles export --help
```
