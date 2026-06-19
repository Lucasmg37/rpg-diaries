import type { AdventureRepository } from "./adventure-repository";
import type { AdventurerRepository } from "./adventurer-repository";
import type { GuildRepository } from "./guild-repository";
import type { LooseEndRepository } from "./loose-end-repository";
import type { SessionRepository } from "./session-repository";
import type { StoryPlanRepository } from "./story-plan-repository";

export * from "./guild-repository";
export * from "./adventure-repository";
export * from "./session-repository";
export * from "./adventurer-repository";
export * from "./loose-end-repository";
export * from "./story-plan-repository";

/**
 * Conjunto completo de repositórios. É a única dependência que os use cases
 * recebem — eles nunca sabem qual adapter está por trás (in-memory, Firestore…).
 */
export interface Repositories {
  guilds: GuildRepository;
  adventures: AdventureRepository;
  sessions: SessionRepository;
  adventurers: AdventurerRepository;
  looseEnds: LooseEndRepository;
  storyPlans: StoryPlanRepository;
}
