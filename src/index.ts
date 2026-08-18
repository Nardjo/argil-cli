#!/usr/bin/env bun
import { Command } from "commander";
import { globalFlags } from "./lib/config.js";
import { authCommand } from "./commands/auth.js";
import { avatarsResource } from "./resources/avatars.js";
import { voicesResource } from "./resources/voices.js";
import { videosResource } from "./resources/videos.js";
import { assetsResource } from "./resources/assets.js";
import { webhooksResource } from "./resources/webhooks.js";
import { subtitlesResource } from "./resources/subtitles.js";

const program = new Command();

program
  .name("argil-cli")
  .description("CLI for the Argil.ai video API")
  .version("0.1.0")
  .option("--json", "Output as JSON", false)
  .option("--format <fmt>", "Output format: text, json, csv, yaml", "text")
  .option("--verbose", "Enable debug logging", false)
  .option("--no-color", "Disable colored output")
  .option("--no-header", "Omit table/csv headers (for piping)")
  .hook("preAction", (_thisCmd, actionCmd) => {
    const root = actionCmd.optsWithGlobals();
    globalFlags.json = root.json ?? false;
    globalFlags.format = root.format ?? "text";
    globalFlags.verbose = root.verbose ?? false;
    globalFlags.noColor = root.color === false;
    globalFlags.noHeader = root.header === false;
  });

// Built-in commands
program.addCommand(authCommand);

// Resources
program.addCommand(avatarsResource);
program.addCommand(voicesResource);
program.addCommand(videosResource);
program.addCommand(assetsResource);
program.addCommand(webhooksResource);
program.addCommand(subtitlesResource);

program.parse();
