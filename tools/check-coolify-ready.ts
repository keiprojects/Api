import fs from "fs";
import path from "path";

type EnvMap = Record<string, string>;

const ENV_PATH = path.resolve(process.cwd(), ".env");

const parseEnvFile = (contents: string): EnvMap => {
  const env: EnvMap = {};
  const lines = contents.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
};

const isPlaceholder = (value?: string) => !value || value.trim().length === 0 || value.includes("REPLACE_ME");

const run = () => {
  if (!fs.existsSync(ENV_PATH)) {
    console.error("Missing .env file. Create one from .env.sample.");
    process.exit(1);
  }

  const contents = fs.readFileSync(ENV_PATH, "utf8");
  const env = parseEnvFile(contents);

  const required = [
    "API_URL",
    "MESSAGING_API",
    "SERVER_PORT",
    "SOCKET_URL",
    "MAIL_SYSTEM",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
    "ENCRYPTION_KEY",
    "JWT_SECRET",
    "SUPPORT_EMAIL",
    "MEMBERSHIP_CONNECTION_STRING",
    "ATTENDANCE_CONNECTION_STRING",
    "CONTENT_CONNECTION_STRING",
    "GIVING_CONNECTION_STRING",
    "MESSAGING_CONNECTION_STRING",
    "DOING_CONNECTION_STRING",
    "REPORTING_CONNECTION_STRING"
  ];

  const missing = required.filter((key) => isPlaceholder(env[key]));
  if (missing.length > 0) {
    console.error("Missing required .env values:");
    missing.forEach((key) => console.error(`- ${key}`));
    process.exit(1);
  }

  if ((env.API_URL || "").includes("churchapps.org")) {
    console.error("API_URL must point to your deployment domain (not api.churchapps.org).");
    process.exit(1);
  }

  if (env.MAIL_SYSTEM !== "SMTP") {
    console.error("MAIL_SYSTEM must be set to SMTP for Coolify (non-AWS) deployments.");
    process.exit(1);
  }

  console.log("Coolify readiness check passed.");
};

run();
