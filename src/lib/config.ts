import { homedir } from "os";
import { join } from "path";

/** Application name (replaced during api2cli create) */
export const APP_NAME = "argil";

/** CLI binary name (replaced during api2cli create) */
export const APP_CLI = "argil-cli";

/** API base URL (replaced during api2cli create) */
export const BASE_URL = "https://api.argil.ai/v1";

/** Auth type: bearer | api-key | basic | custom */
export const AUTH_TYPE = "api-key";

/** Auth header name (e.g. Authorization, X-Api-Key) */
export const AUTH_HEADER = "x-api-key";

/** Path to the token file for this CLI */
export const TOKEN_PATH = join(homedir(), ".config", "tokens", `${APP_NAME}-cli.txt`);

/** Global state for output flags (set by root command) */
export const globalFlags = {
  json: false,
  format: "text" as "text" | "json" | "csv" | "yaml",
  verbose: false,
  noColor: false,
  noHeader: false,
};
