/**
 * Erros de domínio. Permitem que a camada de API traduza falhas em status HTTP
 * corretos (404 / 400) sem depender do texto da mensagem.
 */

/** Entidade não encontrada → 404. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Entrada inválida / violação de regra de negócio → 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
