import crypto from "crypto";

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface ParsedInitData {
  user?: TelegramUser;
  auth_date?: number;
  query_id?: string;
  start_param?: string;
  raw: Record<string, string>;
}

/**
 * Validate Telegram WebApp `initData` using the bot token.
 *
 * Algorithm (per https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app):
 *  1. Parse `initData` as a urlencoded querystring.
 *  2. Take the `hash` field out and form a data-check-string from remaining
 *     fields sorted alphabetically: `key=value\nkey=value\n...`.
 *  3. secretKey = HMAC_SHA256("WebAppData", BOT_TOKEN).
 *  4. expectedHash = HMAC_SHA256(secretKey, dataCheckString).
 *  5. Compare expectedHash with the `hash` field (constant-time).
 */
export function validateInitData(
  initData: string,
  botToken: string,
  maxAgeSeconds = 60 * 60 * 24,
): ParsedInitData | null {
  if (!initData || !botToken) return null;

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .map(([k, v]) => [k, v] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const expectedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const a = Buffer.from(expectedHash, "hex");
  const b = Buffer.from(hash, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  const raw: Record<string, string> = {};
  for (const [k, v] of params.entries()) raw[k] = v;

  const authDate = raw.auth_date ? Number(raw.auth_date) : 0;
  if (!authDate) return null;
  const now = Math.floor(Date.now() / 1000);
  if (now - authDate > maxAgeSeconds) return null;

  let user: TelegramUser | undefined;
  if (raw.user) {
    try {
      user = JSON.parse(raw.user) as TelegramUser;
    } catch {
      return null;
    }
  }

  return {
    user,
    auth_date: authDate,
    query_id: raw.query_id,
    start_param: raw.start_param,
    raw,
  };
}

/** Send a plain message to a chat through the Bot API. */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  opts: { parse_mode?: "HTML" | "MarkdownV2"; disable_notification?: boolean } = {},
): Promise<void> {
  if (!botToken || !chatId) return;
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const body = {
    chat_id: chatId,
    text,
    parse_mode: opts.parse_mode ?? "HTML",
    disable_web_page_preview: true,
    disable_notification: opts.disable_notification ?? false,
  };
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // bot API can be slow occasionally; do not block forever
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.error("Telegram sendMessage failed", res.status, txt);
    }
  } catch (err) {
    console.error("Telegram sendMessage error", err);
  }
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
