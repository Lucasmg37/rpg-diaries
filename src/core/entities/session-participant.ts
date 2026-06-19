/**
 * Estado visual contextual do participante NESTA sessão. Reflete os estados de
 * card do HTML de referência (`.suspicious`, `.fallen`, `.new`).
 * - normal: card padrão
 * - suspicious: destaque de desconfiança (borda vermelha)
 * - fallen: caído/morto na sessão (esmaecido)
 * - new: novo membro (borda verde)
 */
export type ParticipantState = "normal" | "suspicious" | "fallen" | "new";

/**
 * SessionParticipant — objeto EMBUTIDO no array `participants` de uma Session.
 * Não é uma coleção própria.
 *
 * O `sessionBadge` é texto livre digitado pelo Master por sessão (ex.:
 * "⚠ Suspeito", "Apreensivo", "✝ Caído"). O `sessionState` controla o destaque
 * visual do card naquela sessão. Ambos mudam por sessão, por isso moram aqui — e
 * não na entidade Adventurer (que é compartilhada entre sessões). A UI faz o
 * join: resolve `adventurerId` no Adventurer fixo e usa estes campos para o que
 * muda em cada sessão.
 */
export interface SessionParticipant {
  adventurerId: string;
  sessionBadge: string;
  sessionState?: ParticipantState;
  sessionNote?: string;
}
