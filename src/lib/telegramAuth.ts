import { headers } from "next/headers";
import { prisma } from "./prisma";
import { validateInitData } from "./telegram";
import type { User } from "@prisma/client";

/**
 * Resolve the current Telegram user from `x-telegram-init-data` request
 * header (set by the client) and upsert them into the DB.
 *
 * Returns null if validation fails. In development, when
 * SKIP_TELEGRAM_VALIDATION=1 and the header contains a JSON payload like
 * `{"id":123,"username":"dev"}`, the user is upserted without HMAC checks.
 */
export async function getTelegramUserFromHeaders(): Promise<User | null> {
  const h = await headers();
  const initData = h.get("x-telegram-init-data") || "";
  return resolveTelegramUser(initData);
}

export async function resolveTelegramUser(initData: string): Promise<User | null> {
  if (!initData) return null;

  const skip = process.env.SKIP_TELEGRAM_VALIDATION === "1";
  const botToken = process.env.TELEGRAM_BOT_TOKEN || "";

  let tgUser: {
    id: number;
    username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    language_code?: string;
  } | null = null;

  if (skip) {
    // Allow either raw JSON or initData querystring. Try JSON first.
    try {
      const j = JSON.parse(initData);
      if (j && typeof j === "object" && typeof j.id === "number") {
        tgUser = j;
      }
    } catch {
      const params = new URLSearchParams(initData);
      const userRaw = params.get("user");
      if (userRaw) {
        try {
          tgUser = JSON.parse(userRaw);
        } catch {
          tgUser = null;
        }
      }
    }
  } else {
    if (!botToken) return null;
    const parsed = validateInitData(initData, botToken);
    if (!parsed?.user) return null;
    tgUser = parsed.user;
  }

  if (!tgUser?.id) return null;

  const telegramId = String(tgUser.id);
  const user = await prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
      languageCode: tgUser.language_code,
    },
    update: {
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
      languageCode: tgUser.language_code,
    },
  });

  return user;
}
