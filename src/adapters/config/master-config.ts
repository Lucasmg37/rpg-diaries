import { GUILD_ID as SAMPLE_GUILD_ID } from "@/lib/sample-data";

/**
 * Vínculo hardcoded master -> guild (fase atual).
 * O ID da guild do master vem de MASTER_GUILD_ID; se ausente, cai no ID da
 * guild de exemplo (mesmo usado pelo fallback in-memory de desenvolvimento).
 */
export function getMasterGuildId(): string {
  return process.env.MASTER_GUILD_ID || SAMPLE_GUILD_ID;
}
