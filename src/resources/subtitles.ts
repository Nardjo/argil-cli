/**
 * Subtitles resource — list styles and export subtitle files for videos.
 */
import { writeFileSync } from "fs";
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { CliError, handleError } from "../lib/errors.js";
import { buildAuthHeaders } from "../lib/auth.js";
import { BASE_URL } from "../lib/config.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  page?: string;
  pageSize?: string;
  exportFormat?: string;
  includeStyling?: boolean;
  out?: string;
}

export const subtitlesResource = new Command("subtitles").description(
  "List subtitle styles and export subtitles for a video",
);

// ── LIST ──────────────────────────────────────────────
subtitlesResource
  .command("list")
  .description("List available subtitle styles")
  .option("--page <n>", "Page number", "1")
  .option("--page-size <n>", "Items per page", "10")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  argil-cli subtitles list --json")
  .action(async (opts: ActionOpts) => {
    try {
      const res = (await client.get("/subtitles", {
        page: opts.page ?? "1",
        pageSize: opts.pageSize ?? "10",
      })) as { items?: unknown[] };

      const items = res.items ?? res;
      output(items, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── EXPORT ────────────────────────────────────────────
subtitlesResource
  .command("export")
  .description(
    "Export subtitles for a video project as VTT or ASS (raw text, not JSON)",
  )
  .argument("<videoProjectId>", "Video project UUID")
  .option(
    "--export-format <fmt>",
    "Subtitle file format: vtt | ass (maps to query param format)",
    "vtt",
  )
  .option(
    "--include-styling",
    "Include styling information in the export",
    false,
  )
  .option("--out <file>", "Write subtitle content to a file instead of stdout")
  .option("--json", "Wrap raw text in a JSON envelope (for agents)")
  .addHelpText(
    "after",
    "\nExamples:\n  argil-cli subtitles export <video-id> --export-format vtt\n  argil-cli subtitles export <video-id> --export-format ass --include-styling --out captions.ass",
  )
  .action(async (videoProjectId: string, opts: ActionOpts) => {
    try {
      const params = new URLSearchParams();
      if (opts.exportFormat) params.set("format", opts.exportFormat);
      if (opts.includeStyling) params.set("includeStyling", "true");

      const qs = params.toString();
      const url = `${BASE_URL}/subtitles/videos/${videoProjectId}/export${qs ? `?${qs}` : ""}`;

      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "*/*",
          ...buildAuthHeaders(),
        },
        signal: AbortSignal.timeout(30_000),
      });

      const text = await res.text();

      if (!res.ok) {
        let message = res.statusText;
        try {
          const parsed = JSON.parse(text) as { message?: string };
          if (parsed.message) message = parsed.message;
        } catch {
          if (text) message = text.slice(0, 200);
        }
        throw new CliError(res.status, `${res.status}: ${message}`);
      }

      if (opts.out) {
        writeFileSync(opts.out, text, "utf-8");
        if (opts.json) {
          output(
            { written: true, path: opts.out, bytes: text.length },
            { json: true },
          );
        } else {
          console.log(`Wrote ${text.length} bytes to ${opts.out}`);
        }
        return;
      }

      if (opts.json) {
        output(
          { content: text, format: opts.exportFormat ?? "vtt" },
          { json: true },
        );
      } else {
        process.stdout.write(text.endsWith("\n") ? text : `${text}\n`);
      }
    } catch (err) {
      handleError(err, opts.json);
    }
  });
