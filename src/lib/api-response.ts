import { NextResponse } from "next/server";

import { ConflictError, NotFoundError, ValidationError } from "@/core/errors";

/**
 * Converte um erro em resposta JSON com o status HTTP correto:
 * - ValidationError → 400
 * - NotFoundError   → 404
 * - ConflictError   → 409
 * - qualquer outro  → 500 (mensagem genérica; detalhe vai para o log do servidor)
 */
export function apiError(error: unknown): NextResponse {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  if (error instanceof NotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  if (error instanceof ConflictError) {
    return NextResponse.json({ error: error.message }, { status: 409 });
  }
  console.error("[api] erro inesperado:", error);
  return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
}
