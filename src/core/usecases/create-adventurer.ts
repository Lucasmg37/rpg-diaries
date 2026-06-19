import type {
  Adventurer,
  CreateAdventurerInput,
} from "../entities/adventurer";
import type { Repositories } from "../ports";

/**
 * Cria um aventureiro na adventure. O aventureiro é cadastrado uma vez e depois
 * apenas referenciado (com badge próprio) em cada sessão.
 */
export async function createAdventurer(
  repos: Repositories,
  input: CreateAdventurerInput,
): Promise<Adventurer> {
  const adventure = await repos.adventures.getById(
    input.guildId,
    input.adventureId,
  );
  if (!adventure) {
    throw new Error(`Adventure "${input.adventureId}" não encontrada.`);
  }
  return repos.adventurers.create(input);
}
