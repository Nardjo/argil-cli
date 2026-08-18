/**
 * Voices resource — list, get, and sync Argil voices.
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  language?: string;
  gender?: string;
  visibility?: string;
  providerName?: string;
}

export const voicesResource = new Command("voices").description(
  "List, inspect, and sync Argil voices",
);

// ── LIST ──────────────────────────────────────────────
voicesResource
  .command("list")
  .description("List voices available to your workspace")
  .option(
    "--language <lang>",
    "Filter by language (e.g. ENGLISH, FRENCH, SPANISH)",
  )
  .option("--gender <gender>", "Filter by gender: MALE | FEMALE")
  .option("--visibility <vis>", "Filter by visibility: public | private")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  argil-cli voices list\n  argil-cli voices list --language ENGLISH --gender FEMALE --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/voices", {
        ...(opts.language && { language: opts.language }),
        ...(opts.gender && { gender: opts.gender }),
        ...(opts.visibility && { visibility: opts.visibility }),
      });
      output(data, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
voicesResource
  .command("get")
  .description("Get a voice by ID")
  .argument("<id>", "Voice ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  argil-cli voices get <voice-id>")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/voices/${id}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── SYNC ──────────────────────────────────────────────
voicesResource
  .command("sync")
  .description(
    "Re-sync voices from connected ElevenLabs or Minimax provider accounts",
  )
  .option(
    "--provider-name <name>",
    "Optional provider to sync: ELEVEN_LABS | MINIMAX (omit to sync all)",
  )
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  argil-cli voices sync\n  argil-cli voices sync --provider-name ELEVEN_LABS",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.providerName) body.providerName = opts.providerName;
      const data = await client.post(
        "/voices/sync",
        Object.keys(body).length > 0 ? body : {},
      );
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
