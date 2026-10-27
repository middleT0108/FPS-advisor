import fs from "fs";
import path from "path";
import { GameProfile } from "./types";

const GAMES_DIR = path.join(process.cwd(), "src", "data", "games");

/**
 * Tự động đọc tất cả các file JSON trong src/data/games/
 * Cho phép bổ sung game mới mà không cần sửa code.
 */
export function getAllGameProfiles(): GameProfile[] {
  try {
    if (!fs.existsSync(GAMES_DIR)) {
      return [];
    }

    const files = fs.readdirSync(GAMES_DIR).filter((f) => f.endsWith(".json"));
    const profiles: GameProfile[] = [];

    for (const file of files) {
      const fullPath = path.join(GAMES_DIR, file);
      const content = fs.readFileSync(fullPath, "utf-8");
      try {
        const parsed = JSON.parse(content) as GameProfile;
        profiles.push(parsed);
      } catch (err) {
        console.error(`Lỗi khi parse file game profile ${file}:`, err);
      }
    }

    return profiles;
  } catch (error) {
    console.error("Lỗi khi đọc thư mục game profiles:", error);
    return [];
  }
}

/**
 * Lấy hồ sơ của 1 game theo gameId
 */
export function getGameProfileByKey(gameKey: string): GameProfile | null {
  const all = getAllGameProfiles();
  const found = all.find(
    (g) => g.gameId.toLowerCase() === gameKey.toLowerCase()
  );
  return found || null;
}
