/**
 * Guild — a entidade raiz. Cada Mestre (master) está vinculado a uma guild.
 * Nesta fase o vínculo master -> guild é hardcoded (ver master-config.ts).
 */
export interface Guild {
  id: string;
  name: string;
  slug: string;
  description: string;
  masterId: string;
  createdAt: Date;
}
