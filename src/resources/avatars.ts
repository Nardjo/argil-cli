/**
 * Avatars resource — list and get Argil avatars.
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  orientation?: string;
  model?: string;
  visibility?: string;
}

export const avatarsResource = new Command("avatars").description(
  "List and inspect Argil avatars",
);

// ── LIST ──────────────────────────────────────────────
avatarsResource
  .command("list")
  .description("List avatars available to your workspace")
  .option(
    "--orientation <orient>",
    "Filter by orientation: ASPECT_RATIO_16_9 | ASPECT_RATIO_9_16",
  )
  .option("--model <model>", "Filter by model: ARGIL_V1 | ARGIL_ATOM")
  .option("--visibility <vis>", "Filter by visibility: public | private")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText(
    "after",
    "\nExamples:\n  argil-cli avatars list\n  argil-cli avatars list --visibility public --model ARGIL_ATOM --json",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/avatars", {
        ...(opts.orientation && { orientation: opts.orientation }),
        ...(opts.model && { model: opts.model }),
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
avatarsResource
  .command("get")
  .description("Get an avatar by ID")
  .argument("<id>", "Avatar ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  argil-cli avatars get <avatar-id>")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/avatars/${id}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
