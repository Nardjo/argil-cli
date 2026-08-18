/**
 * Webhooks resource — list, create, update, and delete Argil webhooks.
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  callbackUrl?: string;
  events?: string;
}

function parseEvents(csv?: string): string[] | undefined {
  if (!csv) return undefined;
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const webhooksResource = new Command("webhooks").description(
  "Manage Argil webhook subscriptions",
);

// ── LIST ──────────────────────────────────────────────
webhooksResource
  .command("list")
  .description("List webhooks for the authenticated user")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  argil-cli webhooks list --json")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/webhooks");
      const list = Array.isArray(data)
        ? data
        : ((data as { webhooks?: unknown[] }).webhooks ?? data);
      output(list, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
webhooksResource
  .command("create")
  .description("Create a webhook subscription")
  .requiredOption("--callback-url <url>", "HTTPS URL that receives POST events")
  .requiredOption(
    "--events <events>",
    "Comma-separated events: VIDEO_GENERATION_SUCCESS,VIDEO_GENERATION_FAILED,AVATAR_TRAINING_SUCCESS,AVATAR_TRAINING_FAILED",
  )
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  argil-cli webhooks create --callback-url https://example.com/hook --events VIDEO_GENERATION_SUCCESS,VIDEO_GENERATION_FAILED",
  )
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.post("/webhooks", {
        callbackUrl: opts.callbackUrl,
        events: parseEvents(opts.events),
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── UPDATE ────────────────────────────────────────────
webhooksResource
  .command("update")
  .description("Update a webhook (PUT)")
  .argument("<id>", "Webhook ID")
  .option("--callback-url <url>", "New callback URL")
  .option("--events <events>", "Comma-separated events to subscribe to")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    "\nExample:\n  argil-cli webhooks update <id> --callback-url https://example.com/new --events VIDEO_GENERATION_SUCCESS",
  )
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const body: Record<string, unknown> = {};
      if (opts.callbackUrl) body.callbackUrl = opts.callbackUrl;
      if (opts.events) body.events = parseEvents(opts.events);
      const data = await client.put(`/webhooks/${id}`, body);
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
webhooksResource
  .command("delete")
  .description("Delete a webhook by ID")
  .argument("<id>", "Webhook ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  argil-cli webhooks delete <webhook-id>")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      await client.delete(`/webhooks/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
