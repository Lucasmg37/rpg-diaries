import type { SessionParticipant } from "./session-participant";

/** Entrada da linha do tempo de uma sessão. */
export interface TimelineEntry {
  title: string;
  body: string;
  icon: string;
  /** Texto de destaque opcional (caixa de "callout"). */
  callout?: string;
}

/** Etiqueta de destaque da sessão (ex.: "Missão concluída", "Zephyron caído"). */
export interface Tag {
  label: string;
  color: string;
  icon?: string;
}

/**
 * Nota de encerramento da sessão (rodapé do relatório no HTML de referência):
 * uma citação em itálico + uma linha final em maiúsculas.
 */
export interface SessionClosing {
  /** Citação em itálico. */
  quote: string;
  /** Linha final em maiúsculas (estilo Cinzel). */
  tagline: string;
}

/**
 * Session — uma sessão de jogo dentro de uma Adventure.
 *
 * `guildId` e `adventureId` são denormalizados para permitir reconstruir o
 * caminho no Firestore e fazer consultas globais (collectionGroup) por id.
 */
export interface Session {
  id: string;
  guildId: string;
  adventureId: string;
  title: string;
  number: number;
  icon: string;
  summary: string;
  timeline: TimelineEntry[];
  tags: Tag[];
  /** Só exposto na área logada — NUNCA nas páginas públicas. */
  masterNotes: string;
  /** Aventureiros presentes, com badge contextual desta sessão. */
  participants: SessionParticipant[];
  /** Referência por ID aos fios soltos relevantes nesta sessão. */
  looseEndIds: string[];
  /** Nota de encerramento (citação + linha final). */
  closing?: SessionClosing;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateSessionInput = Omit<Session, "id" | "createdAt" | "updatedAt">;

/** Patch parcial para atualizar uma Session. */
export type UpdateSessionInput = Partial<
  Omit<Session, "id" | "guildId" | "adventureId" | "createdAt" | "updatedAt">
>;
