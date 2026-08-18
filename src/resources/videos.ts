/**
 * Videos resource — list, get, create, render, and delete Argil videos.
 */
import { readFileSync } from "fs";
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  page?: string;
  limit?: string;
  nameSearch?: string;
  nameSearchQuery?: string;
  avatarId?: string;
  voiceId?: string;
  extrasFilter?: string;
  name?: string;
  moments?: string;
  momentsFile?: string;
  transcript?: string;
  aspectRatio?: string;
  subtitles?: string;
  subtitleStyleId?: string;
  model?: string;
  callbackUrl?: string;
}

export const videosResource = new Command("videos").description(
  "Create, list, render, and manage Argil videos",
);

// ── LIST ──────────────────────────────────────────────
videosResource
  .command("list")
  .description("List videos (paginated)")
  .option("--page <n>", "Page number", "1")
  .option("--limit <n>", "Items per page", "10")
  .option(
    "--name-search <query>",
    "Filter by name (case-insensitive substring)",
  )
  .option(
    "--nameSearchQuery <query>",
    "Alias for --name-search (API param name)",
  )
  .option("--avatar-id <id>", "Filter by avatar ID")
  .option("--voice-id <id>", "Filter by voice ID")
  .option(
    "--extras-filter <json>",
    'JSON object string to match extras, e.g. \'{"X_ID":"abc"}\'',
  )
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  argil-cli videos list\n  argil-cli videos list --page 2 --limit 20 --name-search demo --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const nameSearch = opts.nameSearch ?? opts.nameSearchQuery;
      const res = (await client.get("/videos", {
        page: opts.page ?? "1",
        limit: opts.limit ?? "10",
        ...(nameSearch && { nameSearchQuery: nameSearch }),
        ...(opts.avatarId && { avatarId: opts.avatarId }),
        ...(opts.voiceId && { voiceId: opts.voiceId }),
        ...(opts.extrasFilter && { extrasFilter: opts.extrasFilter }),
      })) as {
        videos?: unknown[];
        totalItems?: number;
        totalPages?: number;
        currentPage?: number;
        itemsPerPage?: number;
      };

      const videos = res.videos ?? res;
      if (opts.json || opts.format === "json") {
        // Include pagination meta alongside the videos array
        const envelope = {
          videos: Array.isArray(videos) ? videos : res.videos,
          totalItems: res.totalItems,
          totalPages: res.totalPages,
          currentPage: res.currentPage,
          itemsPerPage: res.itemsPerPage,
        };
        output(envelope, { json: opts.json, format: opts.format });
      } else {
        output(videos, {
          json: opts.json,
          format: opts.format,
          fields: opts.fields?.split(","),
        });
        if (
          res.totalItems !== undefined &&
          Array.isArray(videos)
        ) {
          console.error(
            `(page ${res.currentPage ?? opts.page}/${res.totalPages ?? "?"} · ${res.totalItems} total)`,
          );
        }
      }
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
videosResource
  .command("get")
  .description("Get a video by ID")
  .argument("<id>", "Video ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  argil-cli videos get <video-id>")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/videos/${id}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
videosResource
  .command("create")
  .description(
    "Create a video. Pass --moments JSON, --moments-file, or single-moment flags.",
  )
  .requiredOption("--name <name>", "Video name")
  .option(
    "--moments <json>",
    "JSON array of Moment objects (see Argil docs)",
  )
  .option(
    "--moments-file <path>",
    "Path to a JSON file containing the moments array",
  )
  .option(
    "--transcript <text>",
    "Single-moment convenience: transcript (max 500 chars)",
  )
  .option(
    "--avatar-id <id>",
    "Single-moment convenience: avatar ID (required with --transcript)",
  )
  .option(
    "--voice-id <id>",
    "Single-moment convenience: voice ID (sent as voice: { id })",
  )
  .option("--aspect-ratio <ratio>", "Output aspect ratio: 16:9 | 9:16")
  .option(
    "--subtitles <bool>",
    "Enable subtitles: true | false",
  )
  .option(
    "--subtitle-style-id <id>",
    "Subtitle style ID (from argil-cli subtitles list)",
  )
  .option("--model <model>", "Generation model: ARGIL_V1 | ARGIL_ATOM")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    `\nExamples:
  argil-cli videos create --name "Hello" --transcript "Hi there" --avatar-id <id> --voice-id <id>
  argil-cli videos create --name "Multi" --moments '[{"transcript":"Hi","avatarId":"..."}]'
  argil-cli videos create --name "From file" --moments-file ./moments.json --aspect-ratio 9:16 --subtitles true`,
  )
  .action(async (opts: ActionOpts) => {
    try {
      let moments: unknown[] | undefined;

      if (opts.momentsFile) {
        const raw = readFileSync(opts.momentsFile, "utf-8");
        const parsed = JSON.parse(raw);
        moments = Array.isArray(parsed) ? parsed : parsed.moments;
        if (!Array.isArray(moments)) {
          throw new CliError(
            2,
            "moments-file must contain a JSON array or an object with a moments array",
          );
        }
      } else if (opts.moments) {
        const parsed = JSON.parse(opts.moments);
        if (!Array.isArray(parsed)) {
          throw new CliError(2, "--moments must be a JSON array");
        }
        moments = parsed;
      } else if (opts.transcript && opts.avatarId) {
        const moment: Record<string, unknown> = {
          transcript: opts.transcript,
          avatarId: opts.avatarId,
        };
        if (opts.voiceId) {
          moment.voice = { id: opts.voiceId };
        }
        moments = [moment];
      } else {
        throw new CliError(
          2,
          "Provide --moments, --moments-file, or both --transcript and --avatar-id",
          "argil-cli videos create --help",
        );
      }

      const body: Record<string, unknown> = {
        name: opts.name,
        moments,
      };

      if (opts.aspectRatio) body.aspectRatio = opts.aspectRatio;
      if (opts.model) body.model = opts.model;

      if (opts.subtitles !== undefined || opts.subtitleStyleId) {
        const enable =
          opts.subtitles === undefined
            ? true
            : opts.subtitles === "true" || opts.subtitles === "1";
        const subtitles: Record<string, unknown> = { enable };
        if (opts.subtitleStyleId) subtitles.styleId = opts.subtitleStyleId;
        body.subtitles = subtitles;
      }

      const data = await client.post("/videos", body);
      output(data, { json: opts.json });
    } catch (err) {
      if (err instanceof SyntaxError) {
        handleError(
          new CliError(2, `Invalid JSON: ${err.message}`),
          opts.json,
        );
      }
      handleError(err, opts.json);
    }
  });

// ── RENDER ────────────────────────────────────────────
videosResource
  .command("render")
  .description("Start rendering a video by ID")
  .argument("<id>", "Video ID")
  .option(
    "--callback-url <url>",
    "Optional HTTPS URL for a one-shot render completion webhook",
  )
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  argil-cli videos render <video-id>\n  argil-cli videos render <video-id> --callback-url https://example.com/hooks/argil",
  )
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> | undefined = opts.callbackUrl
        ? { callbackUrl: opts.callbackUrl }
        : undefined;
      const data = await client.post(
        `/videos/${id}/render`,
        body ?? {},
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
videosResource
  .command("delete")
  .description("Delete a video by ID")
  .argument("<id>", "Video ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  argil-cli videos delete <video-id>")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      await client.delete(`/videos/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
