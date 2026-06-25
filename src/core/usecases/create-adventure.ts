import type { Adventure, CreateAdventureInput } from "../entities/adventure";
import type { Repositories } from "../ports";

/** Cria uma aventura (campanha) dentro da guilda. */
export async function createAdventure(
  repos: Repositories,
  input: CreateAdventureInput,
): Promise<Adventure> {
  return repos.adventures.create(input);
}
