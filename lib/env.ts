function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSmtpConfig() {
  return {
    host: requireEnv("SMTP_HOST"),
    port: Number.parseInt(requireEnv("SMTP_PORT"), 10),
    secure: requireEnv("SMTP_SECURE") === "true",
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
    fromEmail: requireEnv("FROM_EMAIL"),
  };
}

export function getEmailRoutingConfig() {
  return {
    accountantEmail: requireEnv("ACCOUNTANT_EMAIL"),
    internalCcEmails: parseCcEmails(requireEnv("INTERNAL_CC_EMAILS")),
  };
}

export function parseCcEmails(ccRawValue: string): string[] {
  return ccRawValue
    .split(",")
    .map((email) => email.trim())
    .filter((email) => email.length > 0);
}
