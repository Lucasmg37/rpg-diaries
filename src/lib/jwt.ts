import { SignJWT, jwtVerify, type JWTPayload } from "jose";

/**
 * Emissão e verificação do JWT de sessão do Master.
 * Assinado com HS256 usando JWT_SECRET; expira em 1h.
 */

/** Nome do cookie httpOnly que guarda a sessão do Master. */
export const SESSION_COOKIE = "guild_master_session";

/** Validade do token (segundos) — 1 hora. */
export const SESSION_MAX_AGE = 60 * 60;

export interface MasterPayload extends JWTPayload {
  role: "master";
}

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET não configurado.");
  }
  return new TextEncoder().encode(secret);
}

/** Gera um token de sessão do Master válido por 1h. */
export async function signMasterToken(): Promise<string> {
  return new SignJWT({ role: "master" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("master")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(getSecret());
}

/** Verifica o token; retorna o payload ou null se inválido/expirado. */
export async function verifyMasterToken(
  token: string,
): Promise<MasterPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "master") return null;
    return payload as MasterPayload;
  } catch {
    return null;
  }
}
