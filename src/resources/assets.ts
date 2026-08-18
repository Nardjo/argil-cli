/**
 * Assets resource — list, get, create, and delete Argil media assets.
 */
import { Command } from "commander";
import { client } from "../lib/client.js";
import { output } from "../lib/output.js";
import { handleError } from "../lib/errors.js";

interface ActionOpts {
  json?: boolean;
  format?: string;
  fields?: string;
  name?: string;
  type?: string;
  url?: string;
}

export const assetsResource = new Command("assets").description(
  "Manage image/video assets for B-roll",
);

// ── LIST ──────────────────────────────────────────────
assetsResource
  .command("list")
  .description("List assets in your library")
  .option("--fields <cols>", "Comma-separated columns to display")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  argil-cli assets list --json")
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.get("/assets");
      const list = Array.isArray(data)
        ? data
        : ((data as { assets?: unknown[]; items?: unknown[] }).assets ??
          (data as { items?: unknown[] }).items ??
          data);
      output(list, {
        json: opts.json,
        format: opts.format,
        fields: opts.fields?.split(","),
      });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── GET ───────────────────────────────────────────────
assetsResource
  .command("get")
  .description("Get an asset by ID (poll until status READY)")
  .argument("<id>", "Asset ID")
  .option("--json", "Output as JSON")
  .option("--format <fmt>", "Output format: text, json, csv, yaml")
  .addHelpText("after", "\nExample:\n  argil-cli assets get <asset-id>")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      const data = await client.get(`/assets/${id}`);
      output(data, { json: opts.json, format: opts.format });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── CREATE ────────────────────────────────────────────
assetsResource
  .command("create")
  .description("Upload an image or video asset from a public URL")
  .requiredOption("--name <name>", "Display name for the asset")
  .requiredOption("--type <type>", "Asset type: IMAGE | VIDEO")
  .requiredOption("--url <url>", "Publicly accessible URL of the asset")
  .option("--json", "Output as JSON")
  .addHelpText(
    "after",
    '\nExample:\n  argil-cli assets create --name product --type IMAGE --url "https://example.com/img.png"',
  )
  .action(async (opts: ActionOpts) => {
    try {
      const data = await client.post("/assets", {
        name: opts.name,
        type: opts.type,
        url: opts.url,
      });
      output(data, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });

// ── DELETE ────────────────────────────────────────────
assetsResource
  .command("delete")
  .description("Delete an asset by ID")
  .argument("<id>", "Asset ID")
  .option("--json", "Output as JSON")
  .addHelpText("after", "\nExample:\n  argil-cli assets delete <asset-id>")
  .action(async (id: string, opts: ActionOpts) => {
    try {
      await client.delete(`/assets/${id}`);
      output({ deleted: true, id }, { json: opts.json });
    } catch (err) {
      handleError(err, opts.json);
    }
  });
