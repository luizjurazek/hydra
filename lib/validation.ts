import { z } from "zod";
import { STATUSES } from "./sheetSchema";

export const gameInputSchema = z.object({
  title: z.string().trim().min(1, "Nome do jogo é obrigatório"),
  status: z.enum(STATUSES).optional(),
  genero: z.string().optional(),
  comprado: z.boolean().optional(),
  plataforma: z.string().optional(),
  tempoMedio: z.string().optional(),
  ano: z.string().optional(),
  inicio: z.string().optional(),
  final: z.string().optional(),
  tempoDeJogo: z.string().optional(),
  nota: z.string().optional(),
  image: z.string().optional(),
});

export type GameInput = z.infer<typeof gameInputSchema>;

export const gamePatchSchema = gameInputSchema.partial();

export type GamePatch = z.infer<typeof gamePatchSchema>;
