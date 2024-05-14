import fs from "fs";

// The following code is adapted from the "dotenv" npm package:
// https://www.npmjs.com/package/dotenv
function env(filename?: string): void;
function env(filenames: string[]): void;
function env(fn: string | string[] = ".env"): void {
  (typeof fn === "string" ? [fn] : fn || []).forEach((filename) => {
    const filepath = `${process.cwd()}\\${filename}`;
    if (!fs.existsSync(filepath) || !fs.statSync(filepath).isFile()) return;
    const lineRegex =
      /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/gm;
    const src = fs
      .readFileSync(".env")
      .toString()
      .replace(/\r\n?/gm, "\n")
      .toString();
    let match;
    while ((match = lineRegex.exec(src)) != null) {
      const key = match[1];
      let value = (match[2] || "").trim();
      const maybeQuote = value[0];
      value = value.replace(/^(['"`])([\s\S]*)\1$/gm, "$2");
      if (maybeQuote === '"')
        value = value.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
      process.env[key] = value;
    }
  });
}

export default env;
